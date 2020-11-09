import React from 'react';
import './App.css';
import {useMachine} from "@xstate/react";
import {pomodoroMachine} from "./pomodoro.machine";
import moment from "moment";

function App() {
  const [current, send] = useMachine(pomodoroMachine);
  return (
    <div className="App">
      <header className={`App-header ${current.value}`}>
        <div className="time">
          <code>{moment(current.context.time).format("mm:ss")}</code>
        </div>
        <div>
          {current.matches('idle') && <button onClick={() => send('START_WORK')}>Work</button>}
          {current.matches('idle') && <button onClick={() => send('START_BREAK')}>Break</button>}
          {current.matches('running') && <button onClick={() => send('STOP')}>Stop</button>}
        </div>
      </header>
    </div>
  );
}

export default App;
