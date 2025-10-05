import React, { useRef, useEffect } from 'react';
import * as d3 from 'd3';

const NetworkGraph = ({ projects, onProjectClick }) => {
  const svgRef = useRef();

  useEffect(() => {
    if (!projects || projects.length === 0) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const width = 800;
    const height = 500;

    svg.attr('width', width).attr('height', height);

    // Create nodes and links
    const nodes = [];
    const links = [];

    // Add project nodes
    projects.forEach(project => {
      nodes.push({
        id: project.title,
        type: 'project',
        name: project.title,
        group: 1
      });
      
      nodes.push({
        id: project.piName,
        type: 'pi',
        name: project.piName,
        group: 2
      });
      
      nodes.push({
        id: project.institution,
        type: 'institution',
        name: project.institution,
        group: 3
      });
      
      nodes.push({
        id: project.topic,
        type: 'topic',
        name: project.topic,
        group: 4
      });

      // Add links
      links.push({ source: project.title, target: project.piName });
      links.push({ source: project.title, target: project.institution });
      links.push({ source: project.title, target: project.topic });
    });

    // Remove duplicate nodes
    const uniqueNodes = nodes.filter((node, index, self) => 
      index === self.findIndex(n => n.id === node.id)
    );

    const simulation = d3.forceSimulation(uniqueNodes)
      .force('link', d3.forceLink(links).id(d => d.id).distance(100))
      .force('charge', d3.forceManyBody().strength(-300))
      .force('center', d3.forceCenter(width / 2, height / 2));

    // Add links
    const link = svg.append('g')
      .selectAll('line')
      .data(links)
      .enter().append('line')
      .attr('stroke', '#60A5FA')
      .attr('stroke-opacity', 0.8)
      .attr('stroke-width', 2)
      .style('filter', 'drop-shadow(0 0 3px rgba(96, 165, 250, 0.5))');

    // Add nodes
    const node = svg.append('g')
      .selectAll('circle')
      .data(uniqueNodes)
      .enter().append('circle')
      .attr('r', d => d.type === 'project' ? 8 : 6)
      .attr('fill', d => {
        switch(d.type) {
          case 'project': return '#FDE047'; // Saturn Gold
          case 'pi': return '#FC3D21'; // NASA Red
          case 'institution': return '#10B981'; // Aurora Green
          case 'topic': return '#FB923C'; // Mars Orange
          default: return '#6B7280';
        }
      })
      .attr('stroke', d => {
        switch(d.type) {
          case 'project': return '#F59E0B';
          case 'pi': return '#DC2626';
          case 'institution': return '#059669';
          case 'topic': return '#EA580C';
          default: return '#4B5563';
        }
      })
      .attr('stroke-width', 2)
      .call(d3.drag()
        .on('start', dragstarted)
        .on('drag', dragged)
        .on('end', dragended));

    // Add labels
    const label = svg.append('g')
      .selectAll('text')
      .data(uniqueNodes)
      .enter().append('text')
      .text(d => d.name.length > 20 ? d.name.substring(0, 20) + '...' : d.name)
      .attr('font-size', '10px')
      .attr('fill', 'white')
      .attr('text-anchor', 'middle')
      .attr('dy', -10);

    // Add tooltips
    node.append('title')
      .text(d => `${d.type}: ${d.name}`);

    simulation.on('tick', () => {
      link
        .attr('x1', d => d.source.x)
        .attr('y1', d => d.source.y)
        .attr('x2', d => d.target.x)
        .attr('y2', d => d.target.y);

      node
        .attr('cx', d => d.x)
        .attr('cy', d => d.y);

      label
        .attr('x', d => d.x)
        .attr('y', d => d.y);
    });

    function dragstarted(event, d) {
      if (!event.active) simulation.alphaTarget(0.3).restart();
      d.fx = d.x;
      d.fy = d.y;
    }

    function dragged(event, d) {
      d.fx = event.x;
      d.fy = event.y;
    }

    function dragended(event, d) {
      if (!event.active) simulation.alphaTarget(0);
      d.fx = null;
      d.fy = null;
    }

  }, [projects]);

  return (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      background: 'linear-gradient(135deg, rgba(11, 61, 145, 0.2) 0%, rgba(15, 23, 42, 0.8) 100%)', 
      borderRadius: '15px', 
      padding: '25px',
      border: '1px solid rgba(255, 255, 255, 0.1)',
      boxShadow: 'inset 0 0 50px rgba(96, 165, 250, 0.1)',
      position: 'relative',
      overflow: 'hidden'
    }}>
      <div style={{
        position: 'absolute',
        top: '10px',
        right: '15px',
        fontSize: '24px',
        opacity: 0.7
      }}>
        🌌
      </div>
      <svg ref={svgRef}></svg>
    </div>
  );t(() => {
    if (!projects || projects.length === 0) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const width = 800;
    const height = 500;

    svg.attr('width', width).attr('height', height);

    // Create nodes and links
    const nodes = [];
    const links = [];

    // Add project nodes
    projects.forEach(project => {
      nodes.push({
        id: project.title,
        type: 'project',
        name: project.title,
        group: 1
      });
      
      nodes.push({
        id: project.piName,
        type: 'pi',
        name: project.piName,
        group: 2
      });
      
      nodes.push({
        id: project.institution,
        type: 'institution',
        name: project.institution,
        group: 3
      });
      
      nodes.push({
        id: project.topic,
        type: 'topic',
        name: project.topic,
        group: 4
      });

      // Add links
      links.push({ source: project.title, target: project.piName });
      links.push({ source: project.title, target: project.institution });
      links.push({ source: project.title, target: project.topic });
    });

    // Remove duplicate nodes
    const uniqueNodes = nodes.filter((node, index, self) => 
      index === self.findIndex(n => n.id === node.id)
    );

    const simulation = d3.forceSimulation(uniqueNodes)
      .force('link', d3.forceLink(links).id(d => d.id).distance(100))
      .force('charge', d3.forceManyBody().strength(-300))
      .force('center', d3.forceCenter(width / 2, height / 2));

    // Add links
    const link = svg.append('g')
      .selectAll('line')
      .data(links)
      .enter().append('line')
      .attr('stroke', '#60A5FA')
      .attr('stroke-opacity', 0.8)
      .attr('stroke-width', 2)
      .style('filter', 'drop-shadow(0 0 3px rgba(96, 165, 250, 0.5))');

    // Add nodes
    const node = svg.append('g')
      .selectAll('circle')
      .data(uniqueNodes)
      .enter().append('circle')
      .attr('r', d => d.type === 'project' ? 8 : 6)
      .attr('fill', d => {
        switch(d.type) {
          case 'project': return '#FDE047'; // Saturn Gold
          case 'pi': return '#FC3D21'; // NASA Red
          case 'institution': return '#10B981'; // Aurora Green
          case 'topic': return '#FB923C'; // Mars Orange
          default: return '#6B7280';
        }
      })
      .attr('stroke', d => {
        switch(d.type) {
          case 'project': return '#F59E0B';
          case 'pi': return '#DC2626';
          case 'institution': return '#059669';
          case 'topic': return '#EA580C';
          default: return '#4B5563';
        }
      })
      .attr('stroke-width', 2)
      .call(d3.drag()
        .on('start', dragstarted)
        .on('drag', dragged)
        .on('end', dragended));

    // Add labels
    const label = svg.append('g')
      .selectAll('text')
      .data(uniqueNodes)
      .enter().append('text')
      .text(d => d.name.length > 20 ? d.name.substring(0, 20) + '...' : d.name)
      .attr('font-size', '10px')
      .attr('fill', 'white')
      .attr('text-anchor', 'middle')
      .attr('dy', -10);

    // Add tooltips
    node.append('title')
      .text(d => `${d.type}: ${d.name}`);

    simulation.on('tick', () => {
      link
        .attr('x1', d => d.source.x)
        .attr('y1', d => d.source.y)
        .attr('x2', d => d.target.x)
        .attr('y2', d => d.target.y);

      node
        .attr('cx', d => d.x)
        .attr('cy', d => d.y);

      label
        .attr('x', d => d.x)
        .attr('y', d => d.y);
    });

    function dragstarted(event, d) {
      if (!event.active) simulation.alphaTarget(0.3).restart();
      d.fx = d.x;
      d.fy = d.y;
    }

    function dragged(event, d) {
      d.fx = event.x;
      d.fy = event.y;
    }

    function dragended(event, d) {
      if (!event.active) simulation.alphaTarget(0);
      d.fx = null;
      d.fy = null;
    }

  }, [projects]);

  return (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      background: 'linear-gradient(135deg, rgba(11, 61, 145, 0.2) 0%, rgba(15, 23, 42, 0.8) 100%)', 
      borderRadius: '15px', 
      padding: '25px',
      border: '1px solid rgba(255, 255, 255, 0.1)',
      boxShadow: 'inset 0 0 50px rgba(96, 165, 250, 0.1)',
      position: 'relative',
      overflow: 'hidden'
    }}>
      <div style={{
        position: 'absolute',
        top: '10px',
        right: '15px',
        fontSize: '24px',
        opacity: 0.7
      }}>
        🌌
      </div>
      <svg ref={svgRef}></svg>
    </div>
  );
};

export default NetworkGraph;