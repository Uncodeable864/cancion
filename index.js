// Copyright 2022, Uncodeable864


import chalk from 'chalk';
import inquirer from 'inquirer';
import { createSpinner } from 'nanospinner';
import figlet from 'figlet';

import midi from 'midi';

import { existsSync } from 'fs';
import { timed } from './timed.js';

const waitForInput = ((passThroughInput, closePort = true) => {
    return new Promise((resolve, reject) => {

        // passThroughInput.on('message', (deltaTime, message) => {

        // resolve({ deltaTime, message });
        if (closePort) passThroughInput.closePort()
        resolve()
            // });
    })
});
const sleep = (ms = 2000) => new Promise((r) => setTimeout(r, ms));

figlet('CANCION', (e, d) => {
    if (e) {
        console.log('CANCION: Better Concert Magic')
    }

    console.log(chalk.yellow(d));
})

await sleep(100)

const { midiFileName } = await inquirer.prompt({
    name: 'midiFileName',
    type: 'input',
    message: 'Enter the name of the midi file to play:',
    default: 'cancion.midi',
    validate: (input) => {
        if (input.endsWith('.mid') || input.endsWith('.midi') || input.endsWith('.mid"') || input.endsWith('.midi"')) {
            return true;
        }
        return 'Please enter a valid MIDI file';
    }
});

if (!existsSync(midiFileName)) {
    console.log(chalk.red('File not found'));
    process.exit(1);
} else {
    console.log(`Loading ${chalk.cyan(midiFileName)}`);
}

const input = new midi.Input();

if (input.getPortCount() === 0) {
    console.log(chalk.red('No MIDI I/O devices found. Please connect one and try again.\n'));
    process.exit(1);
}
let inputPortNames = [];
for (let i = 0; i < input.getPortCount(); i++) {
    inputPortNames.push(input.getPortName(i));
}
const { midiPort } = await inquirer.prompt({
    name: 'midiPort',
    type: 'list',
    message: 'Select the MIDI port to use:',
    choices: inputPortNames,
    default: inputPortNames[0],
});

const midiPortIndex = inputPortNames.indexOf(midiPort);
console.log(chalk.bgWhite.black(`Using MIDI port ${chalk.cyan(midiPort)}(Port ${chalk.cyan(midiPortIndex)}), on MIDI file ${chalk.cyan(midiFileName)}`));
console.log('To verify the MIDI port, please connect the MIDI device and press any key on the keyboard.');

input.openPort(midiPortIndex);
const spinner = createSpinner('Run test')
spinner.start()
await waitForInput(input);
spinner.stop()
input.closePort()
console.log(chalk.green('Connection established!'));
let { mode } = await inquirer.prompt({
    name: 'mode',
    type: 'list',
    message: 'Select the mode to use:',
    choices: ['Timed Play: Completly autonomous MIDI playback', 'Note-by-Note Play: Maps each note on the MIDI file to each each note you play for a faked concert experience'],
    default: 'Timed Play: Completly autonomous MIDI playback',
});

if (mode === 'Timed Play: Completly autonomous MIDI playback') {
    mode = "Timed Play";
} else {
    mode = "Note-by-Note Play";
}

const { repeat } = await inquirer.prompt({
    name: 'repeat',
    type: 'confirm',
    message: 'Put MIDI file in a loop?',
    default: true,
});

console.log(`Using mode ${chalk.cyan(mode)}`);
await timed(midiFileName, midiPortIndex, midiPort, repeat);