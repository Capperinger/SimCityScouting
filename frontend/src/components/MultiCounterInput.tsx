import React from "react";
import IntegerInput from "./IntegerInput";

interface MultiCounterInputProps {
    value?: number;
    onChange: (newValue: number) => void;
    min?: number;
    max?: number;
    label?: string;
}

const MultiCounterInput: React.FC<MultiCounterInputProps> = ({
    value = 0,
    onChange,
    min = -1,
    max = Infinity,
    label,
}) => {
    const changeBy = (amount: number) => {
        onChange(Math.min(max, Math.max(min, value + amount)));
    };

    let boxLabel = null;
    if (label != null) {
        boxLabel = (
            <h3 className="font-semibold text-white text-2xl pb-1">{label}</h3>
        );
    }

    return (
        <div className="flex flex-col items-center w-full space-y-4 py-4">
            {boxLabel}

            {/* On mobile: A column (flex-col) containing two rows of buttons and the input.
           On large screens (lg:): A single row (lg:flex-row) containing everything.
        */}
            <div className="flex flex-col lg:flex-row items-center justify-center gap-4 w-full">
                {/* Decrement Group */}
                <div className="flex gap-2 lg:gap-2">
                    <button
                        onClick={() => changeBy(-1)}
                        className="bg-sky-600 text-white font-bold rounded-full h-12 w-12 hover:bg-sky-700 transition-all active:scale-95"
                    >
                        -1
                    </button>
                    <button
                        onClick={() => changeBy(-5)}
                        className="bg-sky-600 text-white font-bold rounded-full h-12 w-12 hover:bg-sky-700 transition-all active:scale-95"
                    >
                        -5
                    </button>
                </div>

                {/* The Input - Stretches on mobile, fixed size on desktop */}
                <div className="w-full max-w-[280px] lg:w-48">
                    <IntegerInput
                        min={0}
                        max={max}
                        label={""}
                        placeholder={"0"}
                        onChange={onChange}
                        value={value || 0}
                    />
                </div>

                {/* Increment Group */}
                <div className="flex gap-2 lg:gap-2">
                    <button
                        onClick={() => changeBy(1)}
                        className="bg-sky-600 text-white font-bold rounded-full h-30 w-30 hover:bg-sky-700 transition-all active:scale-95"
                    >
                        +1
                    </button>
                    <button
                        onClick={() => changeBy(5)}
                        className="bg-sky-600 text-white font-bold rounded-full h-12 w-12 hover:bg-sky-700 transition-all active:scale-95"
                    >
                        +5
                    </button>
                </div>
            </div>
        </div>
    );
};

export default MultiCounterInput;
