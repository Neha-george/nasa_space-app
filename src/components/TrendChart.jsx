import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';

const TrendChart = ({ projects }) => {
  const svgRef = useRef();

  useEffect(() => {
    if (!projects || projects.length === 0) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const margin = { top: 20, right: 30, bottom: 40, left: 40 };
    const width = 400 - margin.left - margin.right;
    const height = 300 - margin.top - margin.bottom;

    // Process data - count projects by year and topic
    const dataByYear = d3.rollup(projects, v => v.length, d => d.year);
    const yearData = Array.from(dataByYear, ([year, count]) => ({ year, count }))
      .sort((a, b) => a.year - b.year);

    if (yearData.length === 0) return;

    const g = svg.append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // Scales
    const xScale = d3.scaleLinear()
      .domain(d3.extent(yearData, d => d.year))
      .range([0, width]);

    const yScale = d3.scaleLinear()
      .domain([0, d3.max(yearData, d => d.count)])
      .range([height, 0]);

    // Line generator
    const line = d3.line()
      .x(d => xScale(d.year))
      .y(d => yScale(d.count))
      .curve(d3.curveMonotoneX);

    // Add axes
    g.append('g')
      .attr('transform', `translate(0,${height})`)
      .call(d3.axisBottom(xScale).tickFormat(d3.format('d')))
      .selectAll('text')
      .style('fill', 'white');

    g.append('g')
      .call(d3.axisLeft(yScale))
      .selectAll('text')
      .style('fill', 'white');

    // Add axis lines
    g.selectAll('.domain, .tick line')
      .style('stroke', 'rgba(255, 255, 255, 0.5)');

    // Add the line
    g.append('path')
      .datum(yearData)
      .attr('fill', 'none')
      .attr('stroke', '#FDE047')
      .attr('stroke-width', 4)
      .attr('d', line)
      .style('filter', 'drop-shadow(0 0 6px rgba(253, 224, 71, 0.6))');

    // Add dots
    g.selectAll('.dot')
      .data(yearData)
      .enter().append('circle')
      .attr('class', 'dot')
      .attr('cx', d => xScale(d.year))
      .attr('cy', d => yScale(d.count))
      .attr('r', 6)
      .attr('fill', '#FC3D21')
      .attr('stroke', '#FDE047')
      .attr('stroke-width', 2)
      .style('filter', 'drop-shadow(0 0 4px rgba(252, 61, 33, 0.8))')
      .append('title')
      .text(d => `${d.year}: ${d.count} projects`);

    // Add labels
    g.append('text')
      .attr('transform', 'rotate(-90)')
      .attr('y', 0 - margin.left)
      .attr('x', 0 - (height / 2))
      .attr('dy', '1em')
      .style('text-anchor', 'middle')
      .style('fill', 'white')
      .style('font-size', '12px')
      .text('Number of Projects');

    g.append('text')
      .attr('transform', `translate(${width / 2}, ${height + margin.bottom})`)
      .style('text-anchor', 'middle')
      .style('fill', 'white')
      .style('font-size', '12px')
      .text('Year');

  }, [projects]);

  return (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      background: 'linear-gradient(135deg, rgba(76, 26, 79, 0.3) 0%, rgba(15, 23, 42, 0.7) 100%)', 
      borderRadius: '15px', 
      padding: '25px',
      border: '1px solid rgba(255, 255, 255, 0.1)',
      boxShadow: 'inset 0 0 30px rgba(253, 224, 71, 0.1)',
      position: 'relative'
    }}>
      <div style={{
        position: 'absolute',
        top: '10px',
        right: '15px',
        fontSize: '20px',
        opacity: 0.7
      }}>
        📊
      </div>
      <svg ref={svgRef} width={400} height={300}></svg>
    </div>
  );
};

export default TrendChart;