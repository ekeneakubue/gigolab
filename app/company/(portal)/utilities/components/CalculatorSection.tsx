"use client";

import { useCallback, useReducer, useState } from "react";

type AngleMode = "deg" | "rad";

function formatDisplay(n: number): string {
  if (!Number.isFinite(n)) return "Error";
  const abs = Math.abs(n);
  if (abs !== 0 && (abs >= 1e12 || abs < 1e-9)) return n.toExponential(8);
  const rounded = Number(parseFloat(n.toPrecision(14)));
  let s = Object.is(rounded, -0) ? "-0" : String(rounded);
  if (s.length > 18) return n.toPrecision(12);
  return s;
}

function opToSymbol(internal: string): string {
  switch (internal) {
    case "/":
      return "÷";
    case "*":
      return "×";
    case "-":
      return "−";
    case "+":
      return "+";
    case "^":
      return "^";
    default:
      return internal;
  }
}

function computeBinary(a: number, b: number, operator: string): number {
  switch (operator) {
    case "+":
      return a + b;
    case "-":
      return a - b;
    case "*":
      return a * b;
    case "/":
      return b === 0 ? NaN : a / b;
    case "^":
      return Math.pow(a, b);
    default:
      return b;
  }
}

type CalcState = {
  display: string;
  previous: number | null;
  op: string | null;
  fresh: boolean;
};

const initialCalc: CalcState = {
  display: "0",
  previous: null,
  op: null,
  fresh: true,
};

type CalcAction =
  | { type: "DIGIT"; digit: string }
  | { type: "OPERATOR"; op: string }
  | { type: "EQUALS" }
  | { type: "CLEAR_ALL" }
  | { type: "CLEAR_ENTRY" }
  | { type: "BACKSPACE" }
  | { type: "NEGATE" }
  | { type: "UNARY"; fn: (n: number) => number }
  | { type: "CONST"; value: number };

function calcReducer(state: CalcState, action: CalcAction): CalcState {
  const displayNum = (): number => {
    if (state.display === "Error") return NaN;
    const v = parseFloat(state.display);
    return Number.isFinite(v) ? v : 0;
  };

  switch (action.type) {
    case "DIGIT": {
      const d = action.digit;
      if (state.display === "Error") {
        return { ...state, display: d === "." ? "0." : d, fresh: false };
      }
      if (state.fresh) {
        return { ...state, display: d === "." ? "0." : d, fresh: false };
      }
      if (d === "." && state.display.includes(".")) return state;
      const next =
        state.display === "0" && d !== "." ? d : state.display + d;
      return { ...state, display: next, fresh: false };
    }

    case "OPERATOR": {
      const nextOp = action.op;
      if (state.display === "Error") return state;

      if (state.op !== null && state.previous !== null && !state.fresh) {
        const result = computeBinary(state.previous, displayNum(), state.op);
        if (!Number.isFinite(result)) {
          return { display: "Error", previous: null, op: null, fresh: true };
        }
        return {
          display: formatDisplay(result),
          previous: result,
          op: nextOp,
          fresh: true,
        };
      }

      return {
        ...state,
        previous: displayNum(),
        op: nextOp,
        fresh: true,
      };
    }

    case "EQUALS": {
      if (state.display === "Error" || state.op === null || state.previous === null) {
        return state;
      }
      const result = computeBinary(state.previous, displayNum(), state.op);
      return {
        display: formatDisplay(result),
        previous: null,
        op: null,
        fresh: true,
      };
    }

    case "CLEAR_ALL":
      return initialCalc;

    case "CLEAR_ENTRY":
      return { ...state, display: "0", fresh: true };

    case "BACKSPACE": {
      if (state.fresh || state.display === "Error") return state;
      if (state.display.length <= 1) return { ...state, display: "0" };
      return { ...state, display: state.display.slice(0, -1) };
    }

    case "NEGATE": {
      if (state.display === "Error") return state;
      return { ...state, display: formatDisplay(-displayNum()), fresh: false };
    }

    case "UNARY": {
      if (state.display === "Error") return state;
      const v = action.fn(displayNum());
      return {
        ...state,
        display: formatDisplay(v),
        previous: null,
        op: null,
        fresh: true,
      };
    }

    case "CONST": {
      return {
        ...state,
        display: formatDisplay(action.value),
        previous: null,
        op: null,
        fresh: true,
      };
    }

    default:
      return state;
  }
}

export default function CalculatorSection() {
  const [calc, dispatch] = useReducer(calcReducer, initialCalc);
  const [angleMode, setAngleMode] = useState<AngleMode>("deg");

  const toRad = useCallback(
    (x: number) => (angleMode === "deg" ? (x * Math.PI) / 180 : x),
    [angleMode],
  );

  const copyResult = useCallback(() => {
    if (calc.display === "Error" || typeof navigator === "undefined" || !navigator.clipboard) return;
    void navigator.clipboard.writeText(calc.display);
  }, [calc.display]);

  const btnNum =
    "rounded-xl border border-[#e8ecf5] bg-white py-3.5 text-lg font-semibold tabular-nums text-zinc-800 shadow-[0_8px_18px_-14px_rgba(15,23,42,0.35)] transition-transform active:scale-[0.98] hover:bg-zinc-50";
  const btnOp =
    "rounded-xl border border-[#d7ddea] bg-[#f3f5fa] py-3.5 text-lg font-semibold text-zinc-800 shadow-[0_8px_18px_-14px_rgba(15,23,42,0.3)] transition-all duration-150 active:scale-[0.98] hover:bg-white";
  const btnOpActive = "border-zinc-700 bg-zinc-700 text-white shadow-[inset_0_2px_8px_rgba(0,0,0,0.15)] hover:bg-zinc-700";
  const btnSci =
    "rounded-xl border border-[#dfe4ef] bg-white py-3 text-xs font-semibold text-zinc-700 shadow-[0_8px_18px_-14px_rgba(15,23,42,0.3)] transition-all duration-150 active:scale-[0.98] hover:bg-zinc-50 sm:text-sm";
  const btnSciActive = "border-zinc-700 bg-zinc-700 text-white shadow-[inset_0_2px_8px_rgba(0,0,0,0.15)] hover:bg-zinc-700";
  const btnEq =
    "rounded-xl border border-zinc-700 bg-zinc-700 py-3.5 text-lg font-semibold text-white shadow-[0_10px_22px_-14px_rgba(15,23,42,0.5)] transition-transform active:scale-[0.98] hover:bg-zinc-800";

  const { display, previous, op } = calc;

  const pendingLabel =
    previous !== null && op !== null ? `${formatDisplay(previous)} ${opToSymbol(op)}` : null;

  const opClass = (internalOp: string) =>
    `${btnOp} ${op === internalOp ? btnOpActive : ""}`;

  const powClass = `${btnSci} ${op === "^" ? btnSciActive : ""}`;

  return (
    <div className="space-y-6">
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-widest text-zinc-600">Calculator</p>
        <h2 className="mt-1 text-lg font-bold text-zinc-900">Scientific calculator</h2>
        <p className="mt-1 max-w-xl text-sm text-zinc-700">
          Basic arithmetic plus common scientific functions. Trigonometry uses the angle mode toggle (degrees or radians).
        </p>
      </div>

      <div className="mx-auto w-full max-w-md rounded-2xl border border-[#dfe4ef] bg-white p-4 shadow-[0_16px_32px_-24px_rgba(15,23,42,0.55)] sm:p-5">
        <div className="mb-3 flex items-center justify-between gap-2">
          <div className="flex rounded-lg border border-[#dfe4ef] bg-[#eef1f6] p-0.5 text-[11px] font-semibold">
            <button
              type="button"
              onClick={() => setAngleMode("deg")}
              className={`rounded-md px-2.5 py-1 ${angleMode === "deg" ? "bg-white text-zinc-900 shadow-sm" : "text-zinc-700"}`}
            >
              Deg
            </button>
            <button
              type="button"
              onClick={() => setAngleMode("rad")}
              className={`rounded-md px-2.5 py-1 ${angleMode === "rad" ? "bg-white text-zinc-900 shadow-sm" : "text-zinc-700"}`}
            >
              Rad
            </button>
          </div>
          <button type="button" onClick={copyResult} className="text-xs font-semibold text-zinc-700 hover:text-zinc-800">
            Copy
          </button>
        </div>

        <div
          className="mb-4 min-h-13 rounded-xl border border-[#e8ecf5] bg-[#f8f9fc] px-4 py-3 text-right font-mono tabular-nums tracking-tight text-zinc-900"
          aria-live="polite"
        >
          <div
            className={`min-h-7 text-base font-semibold leading-tight text-zinc-700 transition-opacity duration-150 sm:text-lg ${pendingLabel ? "opacity-100" : "opacity-0"}`}
            aria-hidden={!pendingLabel}
          >
            {pendingLabel ?? "\u00a0"}
          </div>
          <div className="mt-1 text-2xl font-semibold leading-tight sm:text-3xl">{display}</div>
        </div>

        <div className="grid grid-cols-5 gap-1.5 sm:gap-2">
          <button type="button" className={btnSci} onClick={() => dispatch({ type: "UNARY", fn: (n) => Math.sin(toRad(n)) })}>
            sin
          </button>
          <button type="button" className={btnSci} onClick={() => dispatch({ type: "UNARY", fn: (n) => Math.cos(toRad(n)) })}>
            cos
          </button>
          <button type="button" className={btnSci} onClick={() => dispatch({ type: "UNARY", fn: (n) => Math.tan(toRad(n)) })}>
            tan
          </button>
          <button type="button" className={btnSci} onClick={() => dispatch({ type: "UNARY", fn: (n) => Math.log10(n) })}>
            log
          </button>
          <button type="button" className={btnSci} onClick={() => dispatch({ type: "UNARY", fn: (n) => Math.log(n) })}>
            ln
          </button>

          <button type="button" className={btnSci} onClick={() => dispatch({ type: "UNARY", fn: (n) => Math.sqrt(n) })}>
            √
          </button>
          <button type="button" className={btnSci} onClick={() => dispatch({ type: "UNARY", fn: (n) => n * n })}>
            x²
          </button>
          <button type="button" className={powClass} onClick={() => dispatch({ type: "OPERATOR", op: "^" })}>
            xʸ
          </button>
          <button type="button" className={btnSci} onClick={() => dispatch({ type: "UNARY", fn: (n) => 1 / n })}>
            1/x
          </button>
          <button type="button" className={btnSci} onClick={() => dispatch({ type: "CONST", value: Math.PI })}>
            π
          </button>

          <button type="button" className={btnSci} onClick={() => dispatch({ type: "CONST", value: Math.E })}>
            e
          </button>
          <button type="button" className={btnSci} onClick={() => dispatch({ type: "NEGATE" })}>
            ±
          </button>
          <button type="button" className={btnSci} onClick={() => dispatch({ type: "CLEAR_ENTRY" })}>
            CE
          </button>
          <button type="button" className={btnSci} onClick={() => dispatch({ type: "BACKSPACE" })}>
            ⌫
          </button>
          <button type="button" className={btnSci} onClick={() => dispatch({ type: "CLEAR_ALL" })}>
            AC
          </button>
        </div>

        <div className="mt-3 grid grid-cols-4 gap-1.5 sm:gap-2">
          <button type="button" className={btnNum} onClick={() => dispatch({ type: "DIGIT", digit: "7" })}>
            7
          </button>
          <button type="button" className={btnNum} onClick={() => dispatch({ type: "DIGIT", digit: "8" })}>
            8
          </button>
          <button type="button" className={btnNum} onClick={() => dispatch({ type: "DIGIT", digit: "9" })}>
            9
          </button>
          <button type="button" className={opClass("/")} onClick={() => dispatch({ type: "OPERATOR", op: "/" })}>
            ÷
          </button>

          <button type="button" className={btnNum} onClick={() => dispatch({ type: "DIGIT", digit: "4" })}>
            4
          </button>
          <button type="button" className={btnNum} onClick={() => dispatch({ type: "DIGIT", digit: "5" })}>
            5
          </button>
          <button type="button" className={btnNum} onClick={() => dispatch({ type: "DIGIT", digit: "6" })}>
            6
          </button>
          <button type="button" className={opClass("*")} onClick={() => dispatch({ type: "OPERATOR", op: "*" })}>
            ×
          </button>

          <button type="button" className={btnNum} onClick={() => dispatch({ type: "DIGIT", digit: "1" })}>
            1
          </button>
          <button type="button" className={btnNum} onClick={() => dispatch({ type: "DIGIT", digit: "2" })}>
            2
          </button>
          <button type="button" className={btnNum} onClick={() => dispatch({ type: "DIGIT", digit: "3" })}>
            3
          </button>
          <button type="button" className={opClass("-")} onClick={() => dispatch({ type: "OPERATOR", op: "-" })}>
            −
          </button>

          <button type="button" className={`${btnNum} col-span-2`} onClick={() => dispatch({ type: "DIGIT", digit: "0" })}>
            0
          </button>
          <button type="button" className={btnNum} onClick={() => dispatch({ type: "DIGIT", digit: "." })}>
            .
          </button>
          <button type="button" className={opClass("+")} onClick={() => dispatch({ type: "OPERATOR", op: "+" })}>
            +
          </button>

          <button type="button" className={`${btnEq} col-span-4`} onClick={() => dispatch({ type: "EQUALS" })}>
            =
          </button>
        </div>
      </div>
    </div>
  );
}
