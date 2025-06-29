// --- INITIALIZATION & VALIDATION ---

const processes = JSON.parse(sessionStorage.getItem('processes') || '[]');
const quantum = parseInt(sessionStorage.getItem('quantum') || '4', 10);
const cpuLimit = parseInt(sessionStorage.getItem('cpuLimit') || '10', 10);

function saveProcesses(newProcesses) {
  sessionStorage.setItem('processes', JSON.stringify(newProcesses));
}

function validateProcesses(procs) {
  if (!procs?.length) {
    return { isValid: false, error: "No processes available to schedule." };
  }
  for (let i = 0; i < procs.length; i++) {
    const { id, arrival, burst, priority } = procs[i];
    if ([id, arrival, burst, priority].some(v => v === undefined || v === null)) {
      return { isValid: false, error: `Process at index ${i} is missing required fields.` };
    }
    if (arrival < 0 || burst <= 0) {
      return { isValid: false, error: `Process P${id} has invalid arrival (${arrival}) or burst (${burst}) time.` };
    }
  }
  return { isValid: true };
}

function showVariants(algorithm) {
  const variantsDiv = document.getElementById('variants');
  const buttonsByAlgo = {
    fcfs: [`<button onclick="run('fcfs', 'non-preemptive')">Non-Preemptive</button>`],
    sjf: [
      `<button onclick="run('sjf', 'non-preemptive')">Non-Preemptive</button>`,
      `<button onclick="run('sjf', 'preemptive')">Preemptive</button>`
    ],
    priority: [
      `<button onclick="run('priority', 'non-preemptive')">Non-Preemptive</button>`,
      `<button onclick="run('priority', 'preemptive')">Preemptive</button>`
    ],
    rr: [`<button onclick="run('rr', 'preemptive')">Preemptive</button>`]
  };
  variantsDiv.innerHTML = (buttonsByAlgo[algorithm] || []).join('');
  document.getElementById('result').innerHTML = `
    <h3>Gantt Chart</h3>
    <div id="ganttChart" class="gantt-chart"></div>
    <div id="ganttTimelines" class="gantt-timelines"></div>
  `;
}

function runAlgorithm(algorithm, variant) {
  const algos = {
    fcfs: { 'non-preemptive': fcfs },
    sjf: { 'non-preemptive': sjfNonPreemptive, 'preemptive': sjfPreemptive },
    priority: { 'non-preemptive': priorityNonPreemptive, 'preemptive': priorityPreemptive },
    rr: { 'preemptive': rr }
  };
  const func = algos[algorithm]?.[variant];
  return func ? func() : undefined;
}

function computeComparison() {
  const validation = validateProcesses(processes);
  if (!validation.isValid) return `<p>${validation.error}</p>`;

  const variants = [
    { algorithm: 'fcfs', variant: 'non-preemptive', name: 'FCFS (Non-Preemptive)' },
    { algorithm: 'sjf', variant: 'non-preemptive', name: 'SJF (Non-Preemptive)' },
    { algorithm: 'sjf', variant: 'preemptive', name: 'SJF (Preemptive)' },
    { algorithm: 'priority', variant: 'non-preemptive', name: 'Priority (Non-Preemptive)' },
    { algorithm: 'priority', variant: 'preemptive', name: 'Priority (Preemptive)' },
    { algorithm: 'rr', variant: 'preemptive', name: `Round Robin (Quantum = ${quantum})` }
  ];

  const results = variants.map(v => {
    const result = runAlgorithm(v.algorithm, v.variant);
    return { ...v, result: result || { avgWT: Infinity, avgTAT: Infinity } };
  });

  const bestByWT = results.reduce((a, b) => (b.result.avgWT < a.result.avgWT ? b : a));
  const bestByTAT = results.reduce((a, b) => (b.result.avgTAT < a.result.avgTAT ? b : a));

  const tableRows = results.map(({ name, result }) => `
    <tr style="
      ${name === bestByWT.name ? 'background: rgba(255, 215, 0, 0.2);' : ''}
      ${name === bestByTAT.name ? 'border-left: 4px solid #4CAF50;' : ''}
    " title="${name === bestByWT.name ? 'Best Avg. Waiting Time' : ''}${name === bestByTAT.name ? ' Best Avg. Turnaround Time' : ''}">
      <td>${name}</td>
      <td>${result.avgWT === Infinity ? 'N/A' : result.avgWT.toFixed(2)}</td>
      <td>${result.avgTAT === Infinity ? 'N/A' : result.avgTAT.toFixed(2)}</td>
    </tr>`).join('');

  return `
    <table>
      <thead>
        <tr>
          <th>Algorithm</th>
          <th>Avg. Waiting Time</th>
          <th>Avg. Turnaround Time</th>
        </tr>
      </thead>
      <tbody>${tableRows}</tbody>
    </table>
    <p><strong><span style="background: rgba(255, 215, 0, 0.2); padding: 2px 4px; border-radius: 3px;">Highlighted row</span></strong> indicates the best algorithm for <strong>Average Waiting Time</strong>.</p>
    <p><strong><span style="border-left: 4px solid #4CAF50; padding-left: 4px;">Green left border</span></strong> indicates the best algorithm for <strong>Average Turnaround Time</strong>.</p>
    <br>
    <p><strong>Best for Avg. Waiting Time:</strong> ${bestByWT.name}</p>
    <p><strong>Best for Avg. Turnaround Time:</strong> ${bestByTAT.name}</p>
  `;
}

function run(algorithm, variant) {
  const validation = validateProcesses(processes);
  if (!validation.isValid) {
    document.getElementById('result').innerHTML = `<p>${validation.error}</p>`;
    return;
  }
  const result = runAlgorithm(algorithm, variant);
  if (result) displayResult(result);
}

function displayResult({ title, description, gantt, rows, avgWT, avgTAT, timeComplexity, completed, remaining }) {
  const totalTime = gantt.length ? Math.max(...gantt.map(s => s.end)) : 1;
  const chartHtml = gantt.map(s => `
    <div class="gantt-segment" style="width: ${(s.duration / totalTime) * 100}%" title="P${s.id} (${s.duration}ms)">P${s.id}</div>`).join('');

  const uniqueTimes = [...new Set([...gantt.map(s => s.start), ...gantt.map(s => s.end)])].sort((a, b) => a - b);
  const timelineHtml = uniqueTimes.map(t => `<span style="left: ${(t / totalTime) * 100}%">${t}</span>`).join('');

  document.getElementById('result').innerHTML = `
    <h2>${title}</h2>
    <p>${description}</p>
    <p><strong>Time Complexity:</strong> ${timeComplexity}</p>
    <h3>Gantt Chart</h3>
    <div class="gantt-container">
        <div class="gantt-chart">${chartHtml}</div>
        <div class="gantt-timelines">${timelineHtml}</div>
    </div>
    <h3>Process Details</h3>
    <pre>${rows.join('\n')}</pre>
    <p><strong>Average Waiting Time:</strong> ${avgWT.toFixed(2)}</p>
    <p><strong>Average Turnaround Time:</strong> ${avgTAT.toFixed(2)}</p>
    <hr>
    <p><strong>CPU Limit:</strong> ${cpuLimit} units</p>
    <p><strong>Completed Processes:</strong> ${completed?.length ? completed.map(id => `P${id}`).join(', ') : 'None'}</p>
    <p><strong>Remaining Processes:</strong> ${remaining?.length ? remaining.map(id => `P${id}`).join(', ') : 'None'}</p>
  `;
}

function renderProcessList() {
  const listDiv = document.getElementById('processList');
  if (!listDiv) return;
  if (!processes.length) {
    listDiv.innerHTML = '<p>No processes added.</p>';
    return;
  }
  listDiv.innerHTML = `<table><thead><tr><th>ID</th><th>Arrival</th><th>Burst</th><th>Priority</th><th>Delete</th></tr></thead><tbody>${processes.map((proc, idx) => `
    <tr>
      <td>P${proc.id}</td>
      <td>${proc.arrival}</td>
      <td>${proc.burst}</td>
      <td>${proc.priority}</td>
      <td><button onclick="deleteProcess(${idx})" style="color:#fff;background:#e74c3c;border:none;border-radius:4px;padding:2px 8px;cursor:pointer;">Delete</button></td>
    </tr>`).join('')}</tbody></table>`;
}

function deleteProcess(idx) {
  processes.splice(idx, 1);
  saveProcesses(processes);
  renderProcessList();
}

function addProcess(proc) {
  processes.push(proc);
  saveProcesses(processes);
  renderProcessList();
}

// --- SCHEDULING ALGORITHMS ---

function fcfs() {
  const p = [...processes].sort((a, b) => a.arrival - b.arrival || a.id - b.id);
  let time = 0, totalWT = 0, totalTAT = 0;
  const rows = [], gantt = [], completed = [], remaining = [];

  for (const proc of p) {
    if (time < proc.arrival) time = proc.arrival;
    if (time + proc.burst > cpuLimit) {
      remaining.push(proc.id);
      continue;
    }
    const wt = time - proc.arrival;
    const tat = wt + proc.burst;
    gantt.push({ id: proc.id, start: time, end: time + proc.burst, duration: proc.burst });
    time += proc.burst;
    totalWT += wt;
    totalTAT += tat;
    rows.push(`P${proc.id}: Completion Time=${time}, TAT=${tat}, WT=${wt}`);
    completed.push(proc.id);
  }
  const remainingIds = p.map(proc => proc.id);
  const completedSet = new Set(completed);
  remaining.push(...remainingIds.filter(id => !completedSet.has(id) && !remaining.includes(id)));
  return {
    title: "First Come First Serve (FCFS, Non-Preemptive)",
    description: "Schedules processes in the order they arrive. It is simple but can lead to long waiting times.",
    gantt, rows,
    avgWT: completed.length > 0 ? totalWT / completed.length : 0,
    avgTAT: completed.length > 0 ? totalTAT / completed.length : 0,
    completed, remaining,
    timeComplexity: "O(n log n) due to sorting"
  };
}

function genericNonPreemptive(sortByProperty) {
  const p = JSON.parse(JSON.stringify(processes));
  let remainingProcesses = [...p];
  let time = remainingProcesses.length > 0 ? Math.min(...remainingProcesses.map(proc => proc.arrival)) : 0;
  const results = [];
  const gantt = [];
  const completed = [];

  while (remainingProcesses.length > 0 && time < cpuLimit) {
    let ready = remainingProcesses.filter(proc => proc.arrival <= time);
    if (!ready.length) {
      time = Math.min(...remainingProcesses.map(proc => proc.arrival));
      continue;
    }
    ready.sort((a, b) => a[sortByProperty] - b[sortByProperty] || a.id - b.id);
    const next = ready[0];
    if (time + next.burst > cpuLimit) {
      break;
    }
    const wt = time - next.arrival;
    const tat = wt + next.burst;
    gantt.push({ id: next.id, start: time, end: time + next.burst, duration: next.burst });
    time += next.burst;
    results.push({ ...next, wt, tat, ct: time });
    completed.push(next.id);
    remainingProcesses = remainingProcesses.filter(proc => proc.id !== next.id);
  }
  const totalWT = results.reduce((sum, r) => sum + r.wt, 0);
  const totalTAT = results.reduce((sum, r) => sum + r.tat, 0);
  const rows = results.map(r => `P${r.id}: Completion Time=${r.ct}, TAT=${r.tat}, WT=${r.wt}`);
  return {
    gantt,
    rows,
    avgWT: completed.length > 0 ? totalWT / completed.length : 0,
    avgTAT: completed.length > 0 ? totalTAT / completed.length : 0,
    completed,
    remaining: p.filter(proc => !completed.includes(proc.id)).map(proc => proc.id),
    timeComplexity: "O(n²)"
  };
}

function genericPreemptive(sortByProperty) {
  const p = processes.map(proc => ({ ...proc, remaining: proc.burst, wt: 0, tat: 0 }));
  let time = p.length > 0 ? Math.min(...p.map(proc => proc.arrival)) : 0;
  const gantt = [];
  const completedProcs = [];
  while (time < cpuLimit && p.some(proc => proc.remaining > 0)) {
    const ready = p.filter(proc => proc.arrival <= time && proc.remaining > 0);
    if (!ready.length) {
      time = Math.min(...p.filter(proc => proc.remaining > 0).map(proc => proc.arrival));
      continue;
    }
    const next = ready.reduce((a, b) => (a[sortByProperty] < b[sortByProperty] ? a : (b[sortByProperty] < a[sortByProperty] ? b : (a.id < b.id ? a : b))));
    const lastGantt = gantt[gantt.length - 1];
    if (lastGantt && lastGantt.id === next.id) {
      lastGantt.end = time + 1;
      lastGantt.duration += 1;
    } else {
      gantt.push({ id: next.id, start: time, end: time + 1, duration: 1 });
    }
    next.remaining -= 1;
    time += 1;
    if (next.remaining === 0) {
      next.tat = time - next.arrival;
      next.wt = next.tat - next.burst;
      completedProcs.push(next);
    }
  }
  const completed = completedProcs.map(proc => proc.id);
  const totalWT = completedProcs.reduce((sum, r) => sum + r.wt, 0);
  const totalTAT = completedProcs.reduce((sum, r) => sum + r.tat, 0);
  const rows = completedProcs.sort((a, b) => a.id - b.id).map(r => `P${r.id}: Completion Time=${r.arrival + r.tat}, TAT=${r.tat}, WT=${r.wt}`);
  return {
    gantt, rows,
    avgWT: completed.length > 0 ? totalWT / completed.length : 0,
    avgTAT: completed.length > 0 ? totalTAT / completed.length : 0,
    completed,
    remaining: p.filter(proc => proc.remaining > 0).map(proc => proc.id),
    timeComplexity: "O(n * T) where T is total time"
  };
}

function sjfNonPreemptive() {
  const result = genericNonPreemptive('burst');
  return {
    ...result,
    title: "Shortest Job First (SJF, Non-Preemptive)",
    description: "Selects the waiting process with the smallest execution time to execute next."
  };
}

function priorityNonPreemptive() {
  const result = genericNonPreemptive('priority');
  return {
    ...result,
    title: "Priority Scheduling (Non-Preemptive)",
    description: "Selects the waiting process with the highest priority (lowest number) to execute next."
  };
}

function sjfPreemptive() {
  const result = genericPreemptive('remaining');
  return {
    ...result,
    title: "Shortest Remaining Time First (SRTF, Preemptive SJF)",
    description: "If a new process arrives with a shorter burst time than the current one, it preempts."
  };
}

function priorityPreemptive() {
  const result = genericPreemptive('priority');
  return {
    ...result,
    title: "Priority Scheduling (Preemptive)",
    description: "If a new process arrives with a higher priority, it preempts the current process."
  };
}

function rr() {
  const p = processes.map(proc => ({ ...proc, remaining: proc.burst }));
  let time = p.length > 0 ? Math.min(...p.map(proc => proc.arrival)) : 0;
  const readyQueue = [];
  const completedProcs = [];
  const gantt = [];
  p.sort((a, b) => a.arrival - b.arrival);
  let nextProcessIndex = 0;
  while (time < cpuLimit && (readyQueue.length > 0 || nextProcessIndex < p.length)) {
    while (nextProcessIndex < p.length && p[nextProcessIndex].arrival <= time) {
      readyQueue.push(p[nextProcessIndex]);
      nextProcessIndex++;
    }
    if (readyQueue.length === 0) {
      if (nextProcessIndex < p.length) {
        time = p[nextProcessIndex].arrival;
      }
      continue;
    }
    const current = readyQueue.shift();
    const execTime = Math.min(current.remaining, quantum, cpuLimit - time);
    if (execTime <= 0) {
      readyQueue.unshift(current);
      break;
    }
    gantt.push({ id: current.id, start: time, end: time + execTime, duration: execTime });
    current.remaining -= execTime;
    time += execTime;
    while (nextProcessIndex < p.length && p[nextProcessIndex].arrival <= time) {
      readyQueue.push(p[nextProcessIndex]);
      nextProcessIndex++;
    }
    if (current.remaining > 0) {
      readyQueue.push(current);
    } else {
      const tat = time - current.arrival;
      const wt = tat - current.burst;
      completedProcs.push({ ...current, wt, tat, ct: time });
    }
  }
  const completed = completedProcs.map(proc => proc.id);
  const totalWT = completedProcs.reduce((sum, r) => sum + r.wt, 0);
  const totalTAT = completedProcs.reduce((sum, r) => sum + r.tat, 0);
  const rows = completedProcs.sort((a, b) => a.id - b.id).map(r => `P${r.id}: Completion Time=${r.ct}, TAT=${r.tat}, WT=${r.wt}`);
  return {
    title: `Round Robin (Quantum = ${quantum}, Preemptive)`,
    description: `Each process gets a small unit of CPU time (time quantum). Better for response time.`,
    gantt, rows,
    avgWT: completed.length > 0 ? totalWT / completed.length : 0,
    avgTAT: completed.length > 0 ? totalTAT / completed.length : 0,
    completed,
    remaining: p.filter(proc => proc.remaining > 0).map(proc => proc.id),
    timeComplexity: "O(T) where T is the total execution time"
  };
}

window.renderProcessList = renderProcessList;
window.deleteProcess = deleteProcess;
window.addProcess = addProcess;