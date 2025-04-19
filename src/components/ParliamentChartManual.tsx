import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';

interface ParliamentChartWrapperProps {
    partySeats: Record<string, number>;
}

const ParliamentChartWrapper: React.FC<ParliamentChartWrapperProps> = ({ partySeats }) => {
    const chartRef = useRef<SVGSVGElement | null>(null);

    useEffect(() => {
        if (!partySeats || !chartRef.current) return;

        const svg = d3.select(chartRef.current);
        svg.selectAll('*').remove(); // Clear old chart

        const totalSeats = 129; // Total number of seats in the Scottish Parliament

        const width = 800;
        const height = 400;
        const centerX = width / 2;
        const centerY = height * 0.9;

        const maxRows = 6;
        const seatsPerRow = Math.ceil(totalSeats / maxRows);
        const seatRadius = 10;

        const colors = d3.scaleOrdinal(d3.schemeTableau10);

        const allSeats: { party: string; color: string }[] = [];
        for (const [party, count] of Object.entries(partySeats)) {
            for (let i = 0; i < count; i++) {
                allSeats.push({ party, color: colors(party) });
            }
        }

        const rows: any[] = [];
        let index = 0;

        for (let row = 0; row < maxRows && index < allSeats.length; row++) {
            const rowSpacing = seatRadius * 2 + 8;
            const radius = rowSpacing * (maxRows - row);
            const seatsInThisRow = Math.min(seatsPerRow, allSeats.length - index);
            const angleStep = Math.PI / (seatsInThisRow + 1);

            for (let i = 0; i < seatsInThisRow; i++) {
                const angle = angleStep * (i + 1);
                const x = centerX + radius * Math.cos(angle);
                const y = centerY - radius * Math.sin(angle);
                rows.push({
                    x,
                    y,
                    color: allSeats[index].color,
                });
                index++;
            }
        }

        svg
            .attr('width', width)
            .attr('height', height)
            .attr('viewBox', `0 0 ${width} ${height}`)
            .attr('preserveAspectRatio', 'xMidYMid meet');

        svg
            .selectAll('circle')
            .data(rows)
            .enter()
            .append('circle')
            .attr('cx', d => d.x)
            .attr('cy', d => d.y)
            .attr('r', seatRadius)
            .attr('fill', d => d.color)
            .attr('stroke', '#fff');
    }, [partySeats]);

    return (
        <div style={{ width: '100%', maxWidth: '900px', margin: '0 auto' }}>
            <h2 className="text-xl font-bold mt-8 mb-2">Parliament Seat Distribution</h2>
            <svg ref={chartRef} style={{
                width: '100%', height: 'auto',
                aspectRatio: '2 / 1', // Ensures height scales proportionally
                backgroundColor: '#f0f0f0',
                display: 'block'
            }}></svg>
        </div>
    );
};

export default ParliamentChartWrapper;
