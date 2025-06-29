# CPU Scheduling Simulator 🖥️

This project is a web-based **CPU scheduling algorithm simulator** designed to visually demonstrate and compare various CPU scheduling techniques used in operating systems.

## 📌 Features

* Supports major scheduling algorithms:

  * **FCFS** (First-Come-First-Serve)
  * **SJF (Preemptive & Non-Preemptive)**
  * **Priority Scheduling (Preemptive & Non-Preemptive)**
  * **Round Robin** (Preemptive)
* **Dynamic input** via `sessionStorage` for process list, quantum, **total CPU time**, and CPU limit.
* Visual **Gantt chart** generation.
* Average **Waiting Time (WT)** and **Turnaround Time (TAT)** display.
* **Performance optimized** for large process counts (up to 1000+).

---

## 🚀 Getting Started

### 1. Clone the Repository

```bash
git clone https://github.com/Govardhan-018/CPU_SIMULATOR.git
cd CPU_SIMULATOR
```

### 2. Open `index.html`

```bash
# Simply open in browser
start index.html
```

Or use VS Code Live Server:

```bash
code .
# Right click on index.html > Open with Live Server
```

### 3. Add Processes and Settings

Before running, add your process data and settings to `sessionStorage`:

```js
sessionStorage.setItem("processes", JSON.stringify([
  { id: 1, arrival: 0, burst: 5, priority: 2 },
  { id: 2, arrival: 2, burst: 3, priority: 1 },
  { id: 3, arrival: 4, burst: 2, priority: 3 }
]));
sessionStorage.setItem("quantum", "4");
sessionStorage.setItem("cpuLimit", "100");
sessionStorage.setItem("totalCpuTime", "200"); // Optional additional parameter
```

Then reload the page.

---

## 📊 Output Example

* Gantt Chart visual layout
* Timelines for start/end times
* Per-process WT and TAT
* Average WT, TAT
* CPU Limit and Total CPU Time usage

---

## 🧠 Technologies Used

* JavaScript (Vanilla)
* HTML/CSS
* sessionStorage for state

---

## 🛠 Folder Structure (Recommended)

```
project-root/
├── index.html
├── input.html
├── result.html
├── style.css
├── script.js         # Contains all optimized scheduling logic
├── README.md
```

---

## 📌 Future Enhancements

* Export results as CSV
* Add animation to Gantt chart
* Allow form-based input (instead of using sessionStorage)
* Support I/O burst and context switching time

---

## 🤝 Contributing

Feel free to fork, improve, or raise issues.

---

## 📄 License

This project is licensed under the MIT License.
