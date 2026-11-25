import { NextResponse } from "next/server";

import { getCompanySession } from "@/lib/company-auth";
import { prismaErrorResponse } from "@/lib/prisma-errors";
import { prisma } from "@/lib/prisma";

const DONE_FOR_VALUES = new Set(["Male", "Female", "Both"]);

type ImportRow = {
  lineNumber: number;
  name: string;
  printAs: string;
  department: string;
  subDepartment: string;
  amount: number;
  testMrp: number;
  doneFor: "Male" | "Female" | "Both";
};

function splitCsvLine(line: string): string[] {
  const cells: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }
    if (char === "," && !inQuotes) {
      cells.push(current.trim());
      current = "";
      continue;
    }
    current += char;
  }
  cells.push(current.trim());
  return cells;
}

function normalizeHeader(value: string) {
  return value.trim().toLowerCase().replace(/[\s_-]+/g, "");
}

const HEADER_ALIASES: Record<string, keyof Omit<ImportRow, "amount" | "testMrp" | "doneFor"> | "amount" | "testMrp" | "doneFor"> = {
  name: "name",
  testname: "name",
  test: "name",
  printas: "printAs",
  print: "printAs",
  department: "department",
  departmentname: "department",
  subdepartment: "subDepartment",
  subdept: "subDepartment",
  amount: "amount",
  price: "amount",
  testmrp: "testMrp",
  mrp: "testMrp",
  donefor: "doneFor",
  gender: "doneFor",
};

function parseCsv(text: string): { rows: ImportRow[]; errors: string[] } {
  const lines = text
    .replace(/^\uFEFF/, "")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  if (lines.length < 2) {
    return { rows: [], errors: ["CSV must include a header row and at least one data row."] };
  }

  const headers = splitCsvLine(lines[0]).map(normalizeHeader);
  const indexByField = new Map<string, number>();
  for (let i = 0; i < headers.length; i++) {
    const field = HEADER_ALIASES[headers[i]];
    if (field && !indexByField.has(field)) indexByField.set(field, i);
  }

  const required = ["name", "printAs", "department", "amount", "testMrp", "doneFor"] as const;
  const missing = required.filter((field) => !indexByField.has(field));
  if (missing.length > 0) {
    return {
      rows: [],
      errors: [
        `Missing required columns: ${missing.join(", ")}. Expected headers like name, printAs, department, subDepartment, amount, testMrp, doneFor.`,
      ],
    };
  }

  const rows: ImportRow[] = [];
  const errors: string[] = [];

  for (let lineIndex = 1; lineIndex < lines.length; lineIndex++) {
    const cells = splitCsvLine(lines[lineIndex]);
    const rowNumber = lineIndex + 1;
    const get = (field: string) => {
      const idx = indexByField.get(field);
      return idx === undefined ? "" : (cells[idx] ?? "").trim();
    };

    const name = get("name");
    const printAs = get("printAs");
    const department = get("department");
    const subDepartment = get("subDepartment");
    const amount = Number(get("amount"));
    const testMrp = Number(get("testMrp"));
    const doneForRaw = get("doneFor");
    const doneFor =
      doneForRaw.charAt(0).toUpperCase() + doneForRaw.slice(1).toLowerCase();

    if (!name || !printAs || !department) {
      errors.push(`Row ${rowNumber}: name, printAs, and department are required.`);
      continue;
    }
    if (!Number.isFinite(amount) || amount < 0) {
      errors.push(`Row ${rowNumber}: amount must be a non-negative number.`);
      continue;
    }
    if (!Number.isFinite(testMrp) || testMrp < 0) {
      errors.push(`Row ${rowNumber}: testMrp must be a non-negative number.`);
      continue;
    }
    if (!DONE_FOR_VALUES.has(doneFor)) {
      errors.push(`Row ${rowNumber}: doneFor must be Male, Female, or Both.`);
      continue;
    }

    rows.push({
      lineNumber: rowNumber,
      name,
      printAs,
      department,
      subDepartment,
      amount,
      testMrp,
      doneFor: doneFor as "Male" | "Female" | "Both",
    });
  }

  return { rows, errors };
}

export async function POST(request: Request) {
  const session = await getCompanySession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  try {
    const contentType = request.headers.get("content-type") ?? "";
    let csvText = "";

    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();
      const file = formData.get("file");
      if (!(file instanceof File)) {
        return NextResponse.json({ error: "CSV file is required." }, { status: 400 });
      }
      if (!file.name.toLowerCase().endsWith(".csv") && file.type && !file.type.includes("csv")) {
        return NextResponse.json({ error: "Upload a .csv file." }, { status: 400 });
      }
      csvText = await file.text();
    } else {
      const body = (await request.json().catch(() => null)) as { csv?: string } | null;
      csvText = body?.csv?.trim() ?? "";
    }

    if (!csvText) {
      return NextResponse.json({ error: "CSV content is empty." }, { status: 400 });
    }

    const { rows, errors: parseErrors } = parseCsv(csvText);
    if (rows.length === 0) {
      return NextResponse.json(
        {
          error: parseErrors[0] ?? "No valid rows found in CSV.",
          parseErrors,
          created: 0,
          failed: parseErrors.length,
        },
        { status: 400 },
      );
    }

    const departments = await prisma.department.findMany({
      where: { companyId: session.companyId },
      include: { subDepartments: { select: { id: true, name: true } } },
    });

    const departmentByName = new Map(
      departments.map((dept) => [dept.name.trim().toLowerCase(), dept]),
    );

    const created = [];
    const rowErrors = [...parseErrors];

    for (const row of rows) {
      const department = departmentByName.get(row.department.toLowerCase());
      if (!department) {
        rowErrors.push(
          `Row ${row.lineNumber}: department "${row.department}" was not found. Create it in Masters first.`,
        );
        continue;
      }

      let subDepartmentId: string | null = null;
      if (row.subDepartment) {
        const sub = department.subDepartments.find(
          (item) => item.name.trim().toLowerCase() === row.subDepartment.toLowerCase(),
        );
        if (!sub) {
          rowErrors.push(
            `Row ${row.lineNumber}: sub department "${row.subDepartment}" was not found under "${department.name}".`,
          );
          continue;
        }
        subDepartmentId = sub.id;
      }

      const test = await prisma.test.create({
        data: {
          companyId: session.companyId,
          name: row.name,
          printAs: row.printAs,
          departmentId: department.id,
          subDepartmentId,
          amount: row.amount,
          testMrp: row.testMrp,
          doneFor: row.doneFor,
        },
        include: {
          department: { select: { id: true, name: true } },
          subDepartment: { select: { id: true, name: true } },
        },
      });
      created.push(test);
    }

    return NextResponse.json({
      created: created.length,
      failed: rowErrors.length,
      tests: created,
      errors: rowErrors,
    });
  } catch (error) {
    const { status, message } = prismaErrorResponse(error, "Failed to import tests.");
    return NextResponse.json({ error: message }, { status });
  }
}
