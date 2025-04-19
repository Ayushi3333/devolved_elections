import type { FormEvent } from 'react';
import { useState } from "react";
import '../styles/voteForm.css';
import ParliamentChartWrapper from '../components/ParliamentChart.tsx';

const parties = ['SNP', 'Conservatives', 'Labour', 'Greens', 'Liberal Democrats', 'Alba', 'Reform'];
const partiesList = ['SNP List', 'Conservatives List', 'Labour List', 'Greens List', 'Liberal Democrats List', 'Alba List', 'Reform List'];
const partiesconst = ['SNP Constituency', 'Conservatives Constituency', 'Labour Constituency', 'Greens Constituency', 'Liberal Democrats Constituency', 'Alba Constituency', 'Reform Constituency'];
const existingConstData = {
    SNP: 47.7,
    Conservatives: 21.9,
    Labour: 21.6,
    Greens: 1.3,
    'Liberal Democrats': 6.9,
    Alba: 0,
    Reform: 0
};

const existingListData = {
    SNP: 40.3,
    Conservatives: 23.5,
    Labour: 17.9,
    Greens: 8.1,
    'Liberal Democrats': 5.1,
    Alba: 1.7,
    Reform: 0.2
};

const normalizeParty = (name: string) => {
    return name.toLowerCase().replace(/\s+/g, '');
};

export default function Form() {
    const [userInputConst, setUserInputConst] = useState<any>(null);  // Define state for userInputConst
    const [userInputList, setUserInputList] = useState<any>(null);  // Define state for userInputList
    const [seatCount, setSeatCount] = useState<any>(null);  // Define state for seatCount
    const [finalPartySeats, setfinalPartySeats] = useState<any>(null);  // Define state for finalPartySeats
    const [constResults, setConstResults] = useState<any>(null);  // Define state for constResults
    const [listSeatCount, setListSeatCount] = useState<any>(null);  // Define state for listSeatCount

    async function submit(e: FormEvent<HTMLFormElement>) {
        e.preventDefault();
        const formData = new FormData(e.target as HTMLFormElement);

        const allValuesConst = [...partiesconst].map(name =>
            Number(formData.get(name)) || 0
        );

        const allValuesList = [...partiesList].map(name =>
            Number(formData.get(name)) || 0);

        const totalList = allValuesList.reduce((sum, val) => sum + val, 0);
        const totalConst = allValuesConst.reduce((sum, val) => sum + val, 0);

        const errorMessage = document.getElementById("errorMessage");
        if (totalList < 95 || totalList > 100) {
            if (errorMessage) {
                errorMessage.textContent = `Total List vote share must be between 95 and 100. Current total: ${totalList.toFixed(1)}`;
                errorMessage.classList.remove("hidden");
            }
            return;
        } else if (totalConst < 95 || totalConst > 100) {
            if (errorMessage) {
                errorMessage.textContent = `Total Constituency vote share must be between 95 and 100. Current total: ${totalConst.toFixed(1)}`;
                errorMessage.classList.remove("hidden");
            }
            return;
        }

        if (errorMessage) {
            errorMessage.classList.add("hidden");
        }

        const response = await fetch("api/vote", {
            method: "POST",
            body: formData,
        });

        const { userInputConst, userInputList, seatCount, listSeatCount, finalPartySeats, constResults } = await response.json(); // Get the HTML response from the API
        setUserInputConst(userInputConst);  // Store the user input in the state
        setUserInputList(userInputList);  // Store the user input in the state
        setSeatCount(seatCount);  // Store the seat count in the state
        setListSeatCount(listSeatCount);  // Store the list seat count in the state
        setfinalPartySeats(finalPartySeats);  // Store the final party shares in the state
        setConstResults(constResults);  // Store the constituency results in the state
    }

    const renderCombinedTable = () => {
        if (!userInputConst || !userInputList || !seatCount || !listSeatCount || !finalPartySeats) return null;

        // Merge all keys from each dataset to get a full list of parties
        const allParties = Array.from(new Set([
            ...Object.keys(userInputConst),
            ...Object.keys(userInputList),
            ...Object.keys(seatCount),
            ...Object.keys(listSeatCount),
            ...Object.keys(finalPartySeats)
        ]));

        return (
            <>
                <h2 className="text-xl font-bold mt-8 mb-2">Combined Seat Counts</h2>
                <table className="border-collapse border w-full text-left">
                    <thead>
                        <tr>
                            <th className="border p-2">Party</th>
                            <th className="border p-2">User Constituency Share</th>
                            <th className="border p-2">User List Share</th>
                            <th className="border p-2">Constituency Seats</th>
                            <th className="border p-2">List Seats</th>
                            <th className="border p-2">Total Seats</th>
                        </tr>
                    </thead>
                    <tbody>
                        {allParties.map((party, index) => (
                            <tr key={party}>
                                <td className="border p-2">{party}</td>
                                <td className="border p-2">{userInputConst[party] ?? 0}</td>
                                <td className="border p-2">{userInputList[party] ?? 0}</td>
                                <td className="border p-2">{seatCount[party] ?? 0}</td>
                                <td className="border p-2">{listSeatCount[party] ?? 0}</td>
                                <td className="border p-2">{finalPartySeats[party] ?? 0}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </>
        );
    };

    // Render a table with constituency rows and winning party as columns
    const renderConstituencyWinnersTable = () => {
        if (!constResults) return null;

        return (
            <>
                <h2 className="text-xl font-bold mt-8 mb-2">Constituency Seat Winners</h2>
                <table className="border-collapse border w-full text-left text-black">
                    <thead>
                        <tr>
                            <th className="border p-2">Region</th>
                            <th className="border p-2">Constituency</th>
                            <th className="border p-2">Winner</th>
                        </tr>
                    </thead>
                    <tbody>
                        {constResults.map((results) => {
                            const normalized = normalizeParty(results.winningParty);
                            return (
                                <tr key={results.name} className={normalized}>
                                    <td className="border p-2">{results.region}</td>
                                    <td className="border p-2">{results.name}</td>
                                    <td className="border p-2">{results.winningParty}</td>
                                </tr>
                            )
                        })}
                    </tbody>
                </table>
            </>
        )
    };

    return (
        <form onSubmit={submit}>
            <h2 className="text-xl font-bold mb-2">Scottish Election Share</h2>

            <div className="grid gap-4 scotland-form">
                <div className="grid grid-cols-3 gap-2 font-semibold">
                    <h3 className="text-left">Party</h3>
                    <h3 className="text-left">Constituency Prediction</h3>
                    <h3 className="text-left">List Prediction</h3>
                </div>
                {
                    parties.map((party, index) => (
                        <div className="grid grid-cols-3 gap-2 items-center">
                            <div className="text-left">{party}</div>
                            <input type="number" id={partiesconst[index]} key={partiesconst[index]} name={partiesconst[index]} className="border p-1 w-1/2 vote-input" min="0" max="100" step="0.1" required />

                            <input type="number" id={partiesList[index]} key={partiesList[index]} name={partiesList[index]} className="border p-1 w-1/2 vote-input" min="0" max="100" step="0.1" required />
                        </div >
                    ))
                }
            </div >

            <p id="errorMessage" className="text-red-600 mt-2 hidden"></p>

            <button type="submit" className="mt-4 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition">Submit</button>

            <h3 className="mt-6 text-xl font-bold">Disclaimer</h3>
            <p>
                This is not an official prediction. Instead, it is a tool to visualise how the 2026 election results could look under certain scenarios.


                The numbers here are a projection based on proportional swing but there are other methods which could be used to create projections. The results here should not be taken as fact as there are likely to be some constituency specific candidates, local issues and strategic voting which are difficult to model.

                The recent boundary changes impacted many Scottish Parliamentary constituencies to a greater or lesser degree. Which will be accounted for once the new boundaries are finalised.

                If you’d like to find out more about how AMS works please click here, to find your constituency click here, or to register to vote click here.</p>
            {/* Render tables after submission */}
            {renderCombinedTable()}
            {renderConstituencyWinnersTable()}
            {/* {finalPartySeats && <ParliamentChartWrapper partySeats={finalPartySeats} />} */}
        </form >

    );
}
