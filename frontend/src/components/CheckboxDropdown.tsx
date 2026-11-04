import React, { useState } from "react";

interface CheckboxDropdown {
    label?: string; // Label for the choice
    optionList: Array<string>; // Two options
    optionCheck: Record<string, boolean>;
    onChange: (newValue: Record<string, boolean>) => void;
}

const CheckboxDropdown: React.FC<CheckboxDropdown> = ({
    label,
    optionList,
    optionCheck,
    onChange,
}) => {
    const [showCheckboxes, setShowCheckboxes] = useState<boolean>(false);

    const [newList, setNewList] =
        useState<Record<string, boolean>>(optionCheck);

    const changeList = (option: string) => {
        const updatedList = {
            ...newList,
            [option]: !newList[option],
        };
        setNewList(updatedList);
        onChange(updatedList);
    };

    let boxLabel = null;
    if (label != null) {
        boxLabel = (
            <h3 className="font-semibold text-white text-2xl pb-1">{label}</h3>
        );
    }

    return (
        <div className="flex flex-col items-center space-y-2">
            <div
                onClick={() => {
                    setShowCheckboxes((showCheckboxes) => !showCheckboxes);
                }}
                className="pt-4 cursor-pointer text-white text-l pl-8 pr-8 p-4 flex-col items-start flex justify-center w-60 bg-gray-700 rounded-full focus-within:outline-auto relative"
            >
                <div className="relative">{boxLabel}</div>
            </div>
            <div
                style={{ display: showCheckboxes ? "block" : "none" }}
                className="bg-gray-700 p-4 border-gray-200"
            >
                {optionList.map((option) => (
                    <div className="flex flex-fill" key={option}>
                        <label className="text-white ">
                            <input
                                type="checkbox"
                                onChange={() => {
                                    changeList(option);
                                }}
                                checked={newList[option]}
                            />{" "}
                            {option}
                        </label>
                        <br></br>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default CheckboxDropdown;
