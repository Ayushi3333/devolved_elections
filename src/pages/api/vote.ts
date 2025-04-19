import type { APIRoute } from "astro";
export const prerender = false;
import data_overall_const from '../../data/scotland_overall_constituency_results_2021.json';
import data_overall_list from '../../data/scotland_overall_list_results_2021.json';
import data_const from '../../data/scotland_constituency_results_2021.json';
import data_list from '../../data/scotland_list_results_2021.json';

export const POST: APIRoute = async ({ request }) => {
  const data = await request.formData();

  // User Input
  const snpConst = data.get("SNP Constituency");
  const labourConst = data.get("Labour Constituency");
  const consConst = data.get("Conservatives Constituency");
  const libdemConst = data.get("Liberal Democrats Constituency");
  const greensConst = data.get("Greens Constituency");
  const albaConst = data.get("Alba Constituency");
  const reformConst = data.get("Reform Constituency");

  const snpList = data.get("SNP List");
  const labourList = data.get("Labour List");
  const consList = data.get("Conservatives List");
  const libdemList = data.get("Liberal Democrats List");
  const greensList = data.get("Greens List");
  const albaList = data.get("Alba List");
  const reformList = data.get("Reform List");

  // Combine user input into key-value pairs
  const userInputConst = {
    SNP: snpConst,
    Conservatives: consConst,
    Labour: labourConst,
    "Liberal Democrats": libdemConst,
    Greens: greensConst,
    Reform: reformConst,
    Alba: albaConst
  };

  const userInputList = {
    SNP: snpList,
    Conservatives: consList,
    Labour: labourList,
    "Liberal Democrats": libdemList,
    Greens: greensList,
    Reform: reformList,
    Alba: albaList
  };

  // not user input
  const snpSwing = Number(snpConst) / data_overall_const["parties"]["SNP"];
  const labourSwing = Number(labourConst) / data_overall_const["parties"]["Labour"];
  const consSwing = Number(consConst) / data_overall_const["parties"]["Conservatives"];
  const libdemSwing = Number(libdemConst) / data_overall_const["parties"]["Liberal Democrats"];
  const greensSplit = Number(greensConst) / Number(greensList);
  const albaSplit = Number(albaConst) / Number(albaList);

  const snpListSwing = Number(snpList) / data_overall_list["parties"]["SNP"];
  const labourListSwing = Number(labourList) / data_overall_list["parties"]["Labour"];
  const consListSwing = Number(consList) / data_overall_list["parties"]["Conservatives"];
  const libdemListSwing = Number(libdemList) / data_overall_list["parties"]["Liberal Democrats"];
  const greensListSwing = Number(greensList) / data_overall_list["parties"]["Greens"];
  const albaListSwing = Number(albaList) / data_overall_list["parties"]["Alba"];

  const swingFactors = { SNP: snpSwing, Labour: labourSwing, Conservatives: consSwing, "Liberal Democrats": libdemSwing, Greens: greensListSwing };
  const listSwingFactors = { SNP: snpListSwing, Labour: labourListSwing, Conservatives: consListSwing, "Liberal Democrats": libdemListSwing, Alba: albaListSwing, Greens: greensListSwing };

  function findRegionByConstituency(constituencyName) {
    // Loop through regions and constituencies
    for (const regionKey in data_const) {
      const region = data_const[regionKey];
      if (region.constituencies[constituencyName]) {
        return region.name; // If found, return the region name
      }
    }
    return null; // Return null if no region found for the constituency
  }

  // Flatten all constituencies into a single list
  const allConstituencies = Object.entries(data_const).flatMap(([region, { constituencies }]) =>
    Object.entries(constituencies).map(([name, votes]) => ({ name, votes }))
  );

  const relevantListParties = ["SNP", "Labour", "Conservatives", "Liberal Democrats", "Alba", "Greens"];
  const allParties = ["SNP", "Labour", "Conservatives", "Liberal Democrats", "Alba", "Greens", "Reform"];

  const listPartiesResults = Object.fromEntries(
    Object.entries(data_list).map(([region, parties]) => [
      region,
      Object.fromEntries(
        Object.entries(parties)
          .filter(([party]) => relevantListParties.includes(party)) // Only process relevant parties
          .map(([party, votes]) => [
            party,
            votes * (listSwingFactors[party])
          ])
      )
    ])
  );

  // Calculate the sum of the votes for all parties in each region
  const summedVotesByRegion = Object.fromEntries(
    Object.entries(listPartiesResults).map(([region, parties]) => {
      const totalVotes = Object.values(parties).reduce((sum, votes) => sum + votes, 0);
      return [region, totalVotes];
    })
  );

  const reformListRatio = (
    Number(albaList) + Number(greensList) + Number(reformList)
  ) * Number(reformList);

  console.log("Reform List Ratio: ", reformListRatio);
  const reformRegionalProj = Object.fromEntries(
    Object.entries(summedVotesByRegion).map(([region, totalVotes]) => [
      region,
      (100 - totalVotes) * reformListRatio // Subtract the total result from 100 to get the remaining percentage
    ])
  );
  console.log("Reform Regional Projection: ", reformRegionalProj);
  const greensVoteShare = Object.fromEntries(
    Object.entries(data_list).map(([region, parties]) => {
      // Get Greens' vote share only
      const greensVotes = parties["Greens"];

      // If Greens exist in this region, apply the multipliers
      if (greensVotes !== undefined) {
        return [region, { Greens: greensVotes * greensListSwing * greensSplit }];
      }

      // If Greens are not present, return nothing
      return null;
    }).filter(Boolean) // Remove null entries
  );

  const albaVoteShare = Object.fromEntries(
    Object.entries(data_list).map(([region, parties]) => {
      // Get Alba's vote share only
      const albaVotes = parties["Alba"];

      // If Alba exist in this region, apply the multipliers
      if (albaVotes !== undefined) {
        return [region, { Alba: albaVotes * albaListSwing * albaSplit }];
      }

      // If Alba are not present, return nothing
      return null;
    }).filter(Boolean) // Remove null entries
  );

  const regionalRatios = Object.fromEntries(
    Object.entries(reformRegionalProj).map(([region, reformVotes]) => {
      // Get the corresponding votes for Greens in the same region
      const greensVotes = greensVoteShare[region] || 0; // Default to 0 if no data for that region
      const albaVotes = albaVoteShare[region] || 0; // Default to 0 if no data for that region

      // Calculate the total of Reform and Greens votes for that region
      const totalVotes = reformVotes + greensVotes + albaVotes;

      // Divide the Reform vote share by the total (Reform + Greens)
      const reformRatio = totalVotes > 0 ? (reformVotes / totalVotes) : 0;
      const greensRatio = totalVotes > 0 ? (greensVotes / totalVotes) : 0;
      const albaRatio = totalVotes > 0 ? (albaVotes / totalVotes) : 0;

      return [region, { reformRatio, greensRatio, albaRatio }];
    })
  );


  // Function to calculate vote shares, excluding Greens and Reform
  const calculateVoteShares = (name, votes) => {
    // Filter only relevant parties
    const relevantParties = ["SNP", "Labour", "Conservatives", "Liberal Democrats"];

    // Check if Greens have more than 0% vote share, and if so, include them
    if (votes["Greens"] > 0) {
      relevantParties.push("Greens");
    }
    const voteShares = Object.fromEntries(
      Object.entries(votes)
        .filter(([party]) => relevantParties.includes(party)) // Exclude Greens and Reform
        .map(([party, vote]) => [party, vote * swingFactors[party]]) // Apply swing factor
    );

    const regionRatios = regionalRatios[findRegionByConstituency(name)];
    const leftover = 100 - (votes["SNP"] + votes["Labour"] + votes["Conservatives"] + votes["Liberal Democrats"]);

    // For constituencies with Green vote share > 0, calculate using the formula for Reform and Alba
    if (votes["Greens"] > 0) {
      // Assign the computed value to Reform and Alba
      voteShares["Reform"] = leftover * regionRatios.reformRatio;
      voteShares["Alba"] = leftover * regionRatios.albaRatio;
    } else {
      if (regionalRatios[findRegionByConstituency(name)]) {
        voteShares["Reform"] = leftover * regionRatios.reformRatio;
        voteShares["Greens"] = leftover * regionRatios.greensRatio;
        voteShares["Alba"] = leftover * regionRatios.albaRatio;
      }
    }

    return voteShares;
  };

  // Compute results for all constituencies and track the seats won by each party
  const seatCount = {
    SNP: 0,
    Conservatives: 0,
    Labour: 0,
    "Liberal Democrats": 0,
    Greens: 0,
    Reform: 0,
    Alba: 0
  };

  const constResults = allConstituencies.map(({ name, votes }) => {
    const consVoteShares = calculateVoteShares(name, votes);
    const winningParty = Object.keys(consVoteShares).reduce((maxParty, party) =>
      consVoteShares[party] > consVoteShares[maxParty] ? party : maxParty
    );
    const region = findRegionByConstituency(name);
    // Increment the seat count for the winning party
    seatCount[winningParty]++;
    return { region, name, consVoteShares, winningParty };
  });

  // Count the number of wins by party in each region
  const partyWinsByRegion = constResults.reduce((acc, { region, winningParty }) => {
    if (!acc[region]) {
      acc[region] = {}; // Create region if it doesn’t exist
    }

    if (!acc[region][winningParty]) {
      acc[region][winningParty] = 1; // Start from 1
    } else {
      acc[region][winningParty] += 1;
    }
    return acc;
  }, {});
  // Increment the number of seats won by each party in each region
  for (const region in partyWinsByRegion) {
    for (const party of allParties) {
      partyWinsByRegion[region][party] ??= 0;
      partyWinsByRegion[region][party] += 1;
    }
  }

  // Add Reform results to the existing data
  const updatedParties = Object.fromEntries(
    Object.entries(listPartiesResults).map(([region, parties]) => {
      // Add the Reform party result for the given region
      const reformVotes = reformRegionalProj[region];
      return [
        region,
        {
          ...parties, // Existing parties' results
          Reform: reformVotes // Add Reform party result
        }
      ];
    })
  );

  ////// LIST STARTS HERE /////////////
  const adjustedPartyShares = Object.fromEntries(
    Object.entries(updatedParties).map(([region, partyShares]) => {
      const partyWins = partyWinsByRegion[region] || {};
      const adjustedShares = Object.fromEntries(
        Object.entries(partyShares).map(([party, share]) => {
          return [party, share / partyWins[party]];
        })
      );
      return [region, adjustedShares];
    })
  );

  const adjustedPartySharesRoundTwo = Object.fromEntries(
    Object.entries(adjustedPartyShares).map(([region, shares]) => [
      region,
      Object.entries(shares).reduce((maxParty, [party, share]) =>
        share > shares[maxParty] ? party : maxParty, Object.keys(shares)[0])
    ])
  );
  // Round 2 - adding 1 seat to the winning party in each region above
  const updatedSharesRoundTwo = Object.fromEntries(
    Object.entries(partyWinsByRegion).map(([region, seatCounts]) => {
      const winningParty = adjustedPartySharesRoundTwo[region];
      return [
        region,
        {
          ...seatCounts,
          [winningParty]: seatCounts[winningParty] + 1
        }
      ];
    })
  );

  // Round 3 - Calculate adjusted party shares again
  const adjustedSharesRoundThree = Object.fromEntries(
    Object.entries(updatedParties).map(([region, partyShares]) => {
      const partyWins = updatedSharesRoundTwo[region] || {};
      const adjustedShares = Object.fromEntries(
        Object.entries(partyShares).map(([party, share]) => {
          return [party, share / partyWins[party]];
        })
      );
      return [region, adjustedShares];
    })
  );

  const adjustedPartySharesRoundThree = Object.fromEntries(
    Object.entries(adjustedSharesRoundThree).map(([region, shares]) => [
      region,
      Object.entries(shares).reduce((maxParty, [party, share]) =>
        share > shares[maxParty] ? party : maxParty, Object.keys(shares)[0])
    ])
  );

  // Round 3 - adding 1 seat to the winning party in each region above
  const updatedSharesRoundThree = Object.fromEntries(
    Object.entries(updatedSharesRoundTwo).map(([region, seatCounts]) => {
      const winningParty = adjustedPartySharesRoundThree[region];
      return [
        region,
        {
          ...seatCounts,
          [winningParty]: seatCounts[winningParty] + 1
        }
      ];
    })
  );

  // Round 4 - Calculate adjusted party shares again
  const adjustedSharesRoundFour = Object.fromEntries(
    Object.entries(updatedParties).map(([region, partyShares]) => {
      const partyWins = updatedSharesRoundThree[region] || {};
      const adjustedShares = Object.fromEntries(
        Object.entries(partyShares).map(([party, share]) => {
          return [party, share / partyWins[party]];
        })
      );
      return [region, adjustedShares];
    })
  );

  const adjustedPartySharesRoundFour = Object.fromEntries(
    Object.entries(adjustedSharesRoundFour).map(([region, shares]) => [
      region,
      Object.entries(shares).reduce((maxParty, [party, share]) =>
        share > shares[maxParty] ? party : maxParty, Object.keys(shares)[0])
    ])
  );

  // Round 4 - adding 1 seat to the winning party in each region above
  const updatedSharesRoundFour = Object.fromEntries(
    Object.entries(updatedSharesRoundThree).map(([region, seatCounts]) => {
      const winningParty = adjustedPartySharesRoundFour[region];
      return [
        region,
        {
          ...seatCounts,
          [winningParty]: seatCounts[winningParty] + 1
        }
      ];
    })
  );

  // Round 5 - Calculate adjusted party shares again
  const adjustedSharesRoundFive = Object.fromEntries(
    Object.entries(updatedParties).map(([region, partyShares]) => {
      const partyWins = updatedSharesRoundFour[region] || {};
      const adjustedShares = Object.fromEntries(
        Object.entries(partyShares).map(([party, share]) => {
          return [party, share / partyWins[party]];
        })
      );
      return [region, adjustedShares];
    })
  );

  const adjustedPartySharesRoundFive = Object.fromEntries(
    Object.entries(adjustedSharesRoundFive).map(([region, shares]) => [
      region,
      Object.entries(shares).reduce((maxParty, [party, share]) =>
        share > shares[maxParty] ? party : maxParty, Object.keys(shares)[0])
    ])
  );

  // Round 5 - adding 1 seat to the winning party in each region above
  const updatedSharesRoundFive = Object.fromEntries(
    Object.entries(updatedSharesRoundFour).map(([region, seatCounts]) => {
      const winningParty = adjustedPartySharesRoundFive[region];
      return [
        region,
        {
          ...seatCounts,
          [winningParty]: seatCounts[winningParty] + 1
        }
      ];
    })
  );

  // Round 6 - Calculate adjusted party shares again
  const adjustedSharesRoundSix = Object.fromEntries(
    Object.entries(updatedParties).map(([region, partyShares]) => {
      const partyWins = updatedSharesRoundFive[region] || {};
      const adjustedShares = Object.fromEntries(
        Object.entries(partyShares).map(([party, share]) => {
          return [party, share / partyWins[party]];
        })
      );
      return [region, adjustedShares];
    })
  );

  const adjustedPartySharesRoundSix = Object.fromEntries(
    Object.entries(adjustedSharesRoundSix).map(([region, shares]) => [
      region,
      Object.entries(shares).reduce((maxParty, [party, share]) =>
        share > shares[maxParty] ? party : maxParty, Object.keys(shares)[0])
    ])
  );

  // Round 6 - adding 1 seat to the winning party in each region above
  const updatedSharesRoundSix = Object.fromEntries(
    Object.entries(updatedSharesRoundFive).map(([region, seatCounts]) => {
      const winningParty = adjustedPartySharesRoundSix[region];
      return [
        region,
        {
          ...seatCounts,
          [winningParty]: seatCounts[winningParty] + 1
        }
      ];
    })
  );

  // Round 7 - Calculate adjusted party shares again
  const adjustedSharesRoundSeven = Object.fromEntries(
    Object.entries(updatedParties).map(([region, partyShares]) => {
      const partyWins = updatedSharesRoundSix[region] || {};
      const adjustedShares = Object.fromEntries(
        Object.entries(partyShares).map(([party, share]) => {
          return [party, share / partyWins[party]];
        })
      );
      return [region, adjustedShares];
    })
  );

  const adjustedPartySharesRoundSeven = Object.fromEntries(
    Object.entries(adjustedSharesRoundSeven).map(([region, shares]) => [
      region,
      Object.entries(shares).reduce((maxParty, [party, share]) =>
        share > shares[maxParty] ? party : maxParty, Object.keys(shares)[0])
    ])
  );

  // Round 7 - adding 1 seat to the winning party in each region above
  const updatedSharesRoundSeven = Object.fromEntries(
    Object.entries(updatedSharesRoundSix).map(([region, seatCounts]) => {
      const winningParty = adjustedPartySharesRoundSeven[region];
      return [
        region,
        {
          ...seatCounts,
          [winningParty]: seatCounts[winningParty] + 1
        }
      ];
    })
  );
  // Round 8 - Calculate adjusted party shares again
  const adjustedSharesRoundEight = Object.fromEntries(
    Object.entries(updatedParties).map(([region, partyShares]) => {
      const partyWins = updatedSharesRoundSeven[region] || {};
      const adjustedShares = Object.fromEntries(
        Object.entries(partyShares).map(([party, share]) => {
          return [party, share / partyWins[party]];
        })
      );
      return [region, adjustedShares];
    })
  );

  const adjustedPartySharesRoundEight = Object.fromEntries(
    Object.entries(adjustedSharesRoundEight).map(([region, shares]) => [
      region,
      Object.entries(shares).reduce((maxParty, [party, share]) =>
        share > shares[maxParty] ? party : maxParty, Object.keys(shares)[0])
    ])
  );

  // Round 8 - adding 1 seat to the winning party in each region above
  const updatedSharesRoundEight = Object.fromEntries(
    Object.entries(updatedSharesRoundSeven).map(([region, seatCounts]) => {
      const winningParty = adjustedPartySharesRoundEight[region];
      return [
        region,
        {
          ...seatCounts,
          [winningParty]: seatCounts[winningParty] + 1
        }
      ];
    })
  );

  const calculateListPartyShares = Object.entries(updatedSharesRoundEight).reduce((totals, [region, parties]) => {
    Object.entries(parties).forEach(([party, share]) => {
      if (!totals[party]) {
        totals[party] = 0; // Initialize the party if it doesn't exist
      }
      totals[party] += share; // Add the share to the total for the party
    });
    return totals;
  }, {});

  // Subtract 8 from each party's total
  const finalPartySeats = Object.fromEntries(
    Object.entries(calculateListPartyShares).map(([party, total]) => [
      party,
      total - 8
    ])
  );

  // Subtract seatCount from finalPartySeats to get the list seat count for each party
  const listSeatCount = Object.fromEntries(
    Object.entries(finalPartySeats).map(([party, seats]) => [
      party,
      seats - (seatCount[party] || 0),
    ])
  );

  return new Response(JSON.stringify({ userInputConst, userInputList, seatCount, listSeatCount, finalPartySeats, constResults }), {
    headers: { 'Content-Type': 'application/json' }
  });
};
