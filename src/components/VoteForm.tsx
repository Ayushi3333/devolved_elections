import type { FormEvent } from 'react';
import { useState } from "react";

const partiesList = ['SNP List', 'Conservatives List', 'Labour List', 'Greens List', 'Liberal Democrats List', 'Alba List', 'Reform List'];
const partiesconst = ['SNP Constituency', 'Conservatives Constituency', 'Labour Constituency', 'Greens Constituency', 'Liberal Democrats Constituency', 'Alba Constituency', 'Reform Constituency'];

export default function Form() {
    const [seatCount, setSeatCount] = useState<any>(null);  // Define state for seatCount
    const [finalPartyShares, setFinalPartyShares] = useState<any>(null);  // Define state for finalPartyShares
    async function submit(e: FormEvent<HTMLFormElement>) {
        e.preventDefault();
        const formData = new FormData(e.target as HTMLFormElement);
        const response = await fetch("api/vote", {
            method: "POST",
            body: formData,
        });


        const { seatCount, finalPartyShares } = await response.json(); // Get the HTML response from the API
        setSeatCount(seatCount);  // Store the seat count in the state
        setFinalPartyShares(finalPartyShares);  // Store the final party shares in the state
    }

    // Function to render the tables
    const renderTable = (data: any, title: string) => {
        if (!data) return null;

        return (
            <>
                <h2 className="text-xl font-bold mb-2">{title}</h2>
                <table className="border-collapse border">
                    <thead>
                        <tr>
                            <th className="border p-2">Party</th>
                            <th className="border p-2">Seats</th>
                        </tr>
                    </thead>
                    <tbody>
                        {Object.entries(data).map(([party, seat]) => (
                            <tr key={party}>
                                <td className="border p-2">{party}</td>
                                <td className="border p-2">{seat}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </>
        );
    };

    return (
        <form onSubmit={submit}>
            <h2 className="text-xl font-bold mb-2">Scottish Election List Share</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {
                    partiesList.map((party) => (
                        <div className="flex items-center gap-2">
                            <label htmlFor={`${party}`} className="w-1/2">
                                {party}:
                            </label>
                            <input type="number" id={party} key={party} name={party} className="border p-1 w-1/2 vote-input" min="0" max="100" step="0.1" required />
                        </div>
                    ))
                }
            </div>

            <h2 className="text-xl font-bold mb-2">Scottish Election Constituency Share</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {
                    partiesconst.map((party) => (
                        <div className="flex items-center gap-2">
                            <label htmlFor={`${party}`} className="w-1/2">
                                {party}:
                            </label>
                            <input type="number" id={party} key={party} name={party} className="border p-1 w-1/2 vote-input" min="0" max="100" step="0.1" required />
                        </div>
                    ))
                }
            </div>

            <p id="errorMessage" className="text-red-600 mt-2 hidden"></p>

            <button type="submit" className="mt-4 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition">Submit</button>
            {/* Render tables after submission */}
            {seatCount && renderTable(seatCount, "Constituency Seat Count")}
            {finalPartyShares && renderTable(finalPartyShares, "Total Seat Count")}
        </form>

    );
}
