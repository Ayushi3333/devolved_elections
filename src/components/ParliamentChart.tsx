import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';

interface ParliamentChartWrapperProps {
    partySeats: Record<string, number>;
}

declare global {
    interface Window {
        parliamentChart: any;
    }
}

const ParliamentChartWrapper: React.FC<ParliamentChartWrapperProps> = ({ partySeats }) => {
    const chartRef = useRef<HTMLDivElement | null>(null);

    console.log("Rendering chart with partySeats:", partySeats);

    useEffect(() => {
        const loadScript = async () => {
            // Load chart script if not already loaded
            if (!window.parliamentChart) {
                await new Promise((resolve, reject) => {
                    const script = document.createElement('script');
                    script.src = 'https://cdn.jsdelivr.net/npm/d3-parliament-chart@0.0.6/build/d3-parliament-chart.min.js';
                    script.onload = resolve;
                    script.onerror = reject;
                    document.body.appendChild(script);
                });
            }

            if (!partySeats || !chartRef.current || !window.parliamentChart) return;

            const colorScale = d3.scaleOrdinal(d3.schemeTableau10);

            const data = Object.entries(partySeats).map(([party, seats]) => ({
                party,
                seats,
                color: colorScale(party),
            }));

            chartRef.current.innerHTML = ''; // Clear chart before re-render

            const chart = window.parliamentChart()
                .width(500)
                .height(300)
                .innerRadiusCoef(0.6);

            d3.select(chartRef.current)
                .datum(data)
                .call(chart);
        };
        console.log("window.parliamentChart:", window.parliamentChart);

        loadScript().catch((err) => {
            console.error("Failed to load or render parliamentChart", err);
        });

    }, [partySeats]);
    console.log("Chart Ref:", chartRef.current);

    return (
        <div id="parliament-chart">
            <h2 className="text-xl font-bold mt-8 mb-2">Parliament Seat Distribution</h2>
            <div ref={chartRef}></div>
        </div>
    );
};

export default ParliamentChartWrapper;
