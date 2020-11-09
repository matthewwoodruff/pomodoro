import {assign, EventObject, Machine, StateSchema} from "xstate";

interface Context {
    startTime: number;
    time: number;
    totalTime: number;
    reminder: boolean;
}

interface AppStateSchema extends EventObject {
    states: {
        idle: StateSchema;
        running: StateSchema;
    };
}

const timerEndedMessage = 'Stop working!! Pomodoro Timer ended';
const TWENTY_FIVE_MINS = 1_500_000;
const FIVE_MINUTES = 300_000;
const getTime = (totalTime: number, startTime: number) =>
    Math.ceil((totalTime - (Date.now() - startTime)) / 1000) * 1000;

const showNotification = (title: string) => {
    Notification.requestPermission()
        .then(notificationPermission => {
            if (notificationPermission === 'granted') {
                new Notification(title);

                const speech = new SpeechSynthesisUtterance();
                speech.lang = "en-GB";
                speech.text = title;
                speech.volume = 1;
                speech.rate = 1;
                speech.pitch = 1;
                window.speechSynthesis.speak(speech);
            }
        })
};

export const pomodoroMachine = Machine<Context, AppStateSchema, Event>({
    initial: 'idle',
    context: {
        startTime: 0,
        reminder: false,
        totalTime: TWENTY_FIVE_MINS,
        time: TWENTY_FIVE_MINS
    },
    states: {
        idle: {
            entry: 'resetTime',
            on: {
                START_WORK: {
                    target: 'running',
                    actions: 'setWork'
                },
                START_BREAK: {
                    target: 'running',
                    actions: 'setBreak'
                }
            }
        },
        running: {
            entry: 'resetTime',
            invoke: {
                id: 'interval',
                src: (context, event) => (callback, onReceive) => {
                    const id = setInterval(() => {
                        callback('UPDATE')
                    }, 100);
                    return () => clearInterval(id);
                }
            },
            on: {
                UPDATE: [{
                    cond: ({totalTime, startTime}) => getTime(totalTime, startTime) > 0,
                    actions: ['updateTime', 'showReminder']
                }, {
                    target: 'idle',
                    actions: 'showNotification'
                }],
                STOP: 'idle'
            }
        }
    }
}, {
    actions: {
        resetTime: assign(({totalTime}) => ({
            startTime: Date.now(),
            time: totalTime,
            totalTime
        })),
        updateTime: assign({
            time: ({totalTime, startTime}) => getTime(totalTime, startTime)
        }),
        setWork: assign({
            time: (context) => TWENTY_FIVE_MINS,
            totalTime: (context) => TWENTY_FIVE_MINS
        }),
        setBreak: assign({
            time: (context) => FIVE_MINUTES,
            totalTime: (context) => FIVE_MINUTES
        }),
        showNotification: () => {
            showNotification(timerEndedMessage);
        },
        showReminder: assign({
            reminder: ({totalTime, startTime, reminder}) => {
                if (!reminder && getTime(totalTime, startTime) === FIVE_MINUTES) {
                    showNotification('Five minutes remaining');
                    return true;
                }
                return reminder;
            }
        })
    }
});

