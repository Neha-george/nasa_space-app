import { projects, nodes } from './data.js';

const state = { projects: projects.slice(), filtered: projects.slice() };

const $ = sel => document.querySelector(sel);

function initFilters(){
  const topics = Array.from(new Set(projects.map(p=>p.topic))).sort();
  const sel = $('#topicFilter');
  topics.forEach(t=>{const o=document.createElement('option');o.value=t;o.textContent=t;sel.appendChild(o)});
  sel.addEventListener('change', applyFilters);
  $('#search').addEventListener('input', applyFilters);
  $('#resetBtn').addEventListener('click', ()=>{ $('#search').value=''; $('#topicFilter').value='all'; applyFilters(); });
}

function applyFilters(){
  const q = $('#search').value.trim().toLowerCase();
  const topic = $('#topicFilter').value;
  state.filtered = projects.filter(p=>{
    const matchTopic = topic==='all' ? true : p.topic===topic;
    const matchQ = q === '' ? true : (p.title+p.piName+p.institution+p.topic).toLowerCase().includes(q);
    return matchTopic && matchQ;
  });
  renderTable();
  renderTrend();
  renderGraph();
}

function renderTable(){
  const wrap = $('#tableWrap');
  wrap.innerHTML = '';
  const table = document.createElement('table');
  const thead = document.createElement('thead');
  thead.innerHTML = '<tr><th>Title</th><th>PI</th><th>Inst</th><th>Year</th><th></th></tr>';
  table.appendChild(thead);
  const tbody = document.createElement('tbody');
  state.filtered.forEach(p=>{
    const tr = document.createElement('tr');
    tr.innerHTML = `<td>${p.title}</td><td>${p.piName}</td><td>${p.institution}</td><td>${p.year}</td><td><button class="view-btn" data-id="${p.id}">View</button></td>`;
    tbody.appendChild(tr);
  });
  table.appendChild(tbody);
  wrap.appendChild(table);
  wrap.querySelectorAll('.view-btn').forEach(b=>b.addEventListener('click', e=>{
    const id = +e.currentTarget.dataset.id;
    openModal(projects.find(p=>p.id===id));
  }));
}

function renderTrend(){
  const svg = d3.select('#trend');
  svg.selectAll('*').remove();
  const years = Array.from(new Set(projects.map(p=>p.year))).sort();
  const counts = years.map(y=>({ year: y, count: projects.filter(p=>p.year===y).length }));
  const rect = svg.node().getBoundingClientRect();
  const fullW = rect.width || 800;
  const fullH = rect.height || 120;
  // margins to keep axes and bars inside the card
  const margin = { left: 44, right: 12, top: 8, bottom: 28 };
  const innerW = Math.max(40, fullW - margin.left - margin.right);
  const innerH = Math.max(20, fullH - margin.top - margin.bottom);
  // gradient for trend bars
  const defs = svg.append('defs');
  const tgrad = defs.append('linearGradient').attr('id','trendGrad').attr('x1','0%').attr('x2','0%');
  tgrad.append('stop').attr('offset','0%').attr('stop-color','#2aa2ff');
  tgrad.append('stop').attr('offset','100%').attr('stop-color','#ff6f3c');
  const x = d3.scaleBand().domain(counts.map(d=>d.year)).range([margin.left, margin.left + innerW]).padding(0.2);
  const y = d3.scaleLinear().domain([0, d3.max(counts,d=>d.count)||1]).range([margin.top + innerH, margin.top]);

  // bars
  svg.append('g').selectAll('rect').data(counts).join('rect')
    .attr('x',d=>x(d.year))
    .attr('y',d=>y(d.count))
    .attr('width',x.bandwidth())
    .attr('height',d=> (margin.top + innerH) - y(d.count))
    .attr('fill','url(#trendGrad)');

  // axis at bottom of inner chart area
  svg.append('g').attr('transform',`translate(0,${margin.top + innerH})`).call(d3.axisBottom(x).tickFormat(d=>d)).attr('color','#9fb6d7');
}

function openModal(project){
  const modal = $('#modal');
  const body = $('#modalBody');
  body.innerHTML = `
    <h2 style="margin-top:0">${project.title}</h2>
    <p class="proj-meta"><strong>PI:</strong> ${project.piName} &nbsp; <strong>Institution:</strong> ${project.institution} &nbsp; <strong>Year:</strong> ${project.year}</p>
    <p style="margin-top:12px">${project.description}</p>
  `;
  modal.classList.remove('hidden');
  modal.setAttribute('aria-hidden','false');
}

function closeModal(){
  const modal = $('#modal');
  modal.classList.add('hidden');
  modal.setAttribute('aria-hidden','true');
}

function renderGraph(){
  const data = nodes();
  const svg = d3.select('#network');
  svg.selectAll('*').remove();
  const rect = svg.node().getBoundingClientRect();
  const width = rect.width || 800;
  const height = rect.height || 500;
  // defs for gradients
  const defs = svg.append('defs');
  const grad = defs.append('linearGradient').attr('id','grad1').attr('x1','0%').attr('x2','0%');
  grad.append('stop').attr('offset','0%').attr('stop-color','#1b75bb');
  grad.append('stop').attr('offset','100%').attr('stop-color','#ff6f3c');

  // group that will be transformed to fit all nodes
  const container = svg.append('g').attr('class','graph-container');

  const link = container.append('g').attr('stroke','rgba(255,255,255,0.06)').selectAll('line').data(data.links).join('line');

  const node = container.append('g').selectAll('g').data(data.nodes).join('g').attr('class','node');

  node.append('circle').attr('r', d=> d.type==='project'?8: d.type==='topic'?12:10 ).attr('fill', d=> d.type==='project'? '#2aa2ff': d.type==='topic' ? '#ffb86b':'#9bd3ff').attr('stroke','#00000022');

  node.append('text').attr('class','node-label').attr('x',12).attr('y',4).text(d=> d.type==='project'? d.name : d.name);

  const simulation = d3.forceSimulation(data.nodes)
    .force('link', d3.forceLink(data.links).id(d=>d.id).distance(d=> d.source.type==='project' || d.target.type==='project' ? 90:140))
    .force('charge', d3.forceManyBody().strength(-160))
    .force('center', d3.forceCenter(width/2, height/2))
    .on('tick', ticked)
    .on('end', ()=>{ // when simulation stabilizes, fit content into view
      try{ fitToView(); } catch(e){ console.warn('fitToView failed', e); }
    });

  node.call(d3.drag().on('start', (event,d)=>{ if(!event.active) simulation.alphaTarget(0.3).restart(); d.fx = d.x; d.fy = d.y; })
    .on('drag', (event,d)=>{ d.fx = event.x; d.fy = event.y })
    .on('end',(event,d)=>{ if(!event.active) simulation.alphaTarget(0); d.fx = null; d.fy = null;}));

  node.on('click', (event,d)=>{
    if(d.type==='project'){
      const pid = d.projectId;
      const proj = projects.find(p=>p.id===pid);
      if(proj) openModal(proj);
    }
  });

  // D3 zoom behavior
  const zoom = d3.zoom().scaleExtent([0.4, 2]).on('zoom', (event)=>{
    container.attr('transform', event.transform);
    // keep the slider in sync
    const z = event.transform.k;
    const slider = document.getElementById('zoomRange');
    if(slider) slider.value = (Math.round(z*100)/100).toString();
  });

  // apply zoom to svg
  svg.call(zoom).on('dblclick.zoom', null);

  // slider control
  const slider = document.getElementById('zoomRange');
  if(slider){
    slider.addEventListener('input', (e)=>{
      const k = parseFloat(e.target.value);
      // preserve current center by using current translate and applying new scale
      const t = d3.zoomTransform(svg.node());
      const cx = width/2, cy = height/2;
      const newX = cx - k * ((cx - t.x) / t.k);
      const newY = cy - k * ((cy - t.y) / t.k);
      svg.transition().duration(120).call(zoom.transform, d3.zoomIdentity.translate(newX, newY).scale(k));
    });
  }

  // reset view button
  const resetBtn = document.getElementById('resetView');
  if(resetBtn){
    resetBtn.addEventListener('click', ()=>{
      // clear any transforms and re-fit
      svg.transition().duration(400).call(zoom.transform, d3.zoomIdentity.translate(0,0).scale(1));
      setTimeout(()=>{ try{ fitToView(); } catch(e){} }, 450);
    });
  }

  function ticked(){
    link.attr('x1',d=>d.source.x).attr('y1',d=>d.source.y).attr('x2',d=>d.target.x).attr('y2',d=>d.target.y);
    node.attr('transform',d=>`translate(${d.x},${d.y})`);
  }

  function fitToView(){
    const margin = 40; // px
    // compute bounding box of nodes
    const xs = data.nodes.map(n=>n.x||0);
    const ys = data.nodes.map(n=>n.y||0);
    const minX = Math.min(...xs);
    const maxX = Math.max(...xs);
    const minY = Math.min(...ys);
    const maxY = Math.max(...ys);
    const contentW = maxX - minX || 1;
    const contentH = maxY - minY || 1;
    const viewW = width - margin*2;
    const viewH = height - margin*2;
    const scale = Math.min(viewW / contentW, viewH / contentH, 1.6);
    const cx = (minX + maxX) / 2;
    const cy = (minY + maxY) / 2;
    const tx = (width / 2) - scale * cx;
    const ty = (height / 2) - scale * cy;
    // apply transform using d3.zoom so the zoom state is consistent
    const svgEl = svg.node();
    const z = d3.zoom().scaleExtent([0.4,2]);
    const tfn = d3.zoomIdentity.translate(tx, ty).scale(scale);
    d3.select(svgEl).transition().duration(700).call(z.transform, tfn);
    // update slider if present
    const slider = document.getElementById('zoomRange');
    if(slider) slider.value = (Math.round(scale*100)/100).toString();
  }
}

document.addEventListener('DOMContentLoaded', ()=>{
  initFilters(); renderTable(); renderTrend(); renderGraph();
  $('#closeModal').addEventListener('click', closeModal);
  $('#modal').addEventListener('click', e=>{ if(e.target.id==='modal') closeModal(); });
  document.addEventListener('keydown', e=>{ if(e.key==='Escape') closeModal(); });
});

// Re-render on resize with debounce
let resizeTimer = null;
window.addEventListener('resize', ()=>{
  if(resizeTimer) clearTimeout(resizeTimer);
  resizeTimer = setTimeout(()=>{ renderTrend(); renderGraph(); }, 250);
});
