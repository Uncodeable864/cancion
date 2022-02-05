import midi from 'midi';
import chalk from 'chalk';
import { readFileSync } from 'fs';
import inquirer from 'inquirer';
//parseMIDi
import * as midiFile from 'midi-file';;
const sleep = (ms = 2000) => new Promise((r) => setTimeout(r, ms));

export async function timed(midiFileName, midiPortIndex, midiPort, repeat = true) {
    console.clear();
    console.log(chalk.bgWhite.black(`Using MIDI port ${chalk.cyan(midiPort)}(Port ${chalk.cyan(midiPortIndex)}), on MIDI file ${chalk.cyan(midiFileName)} with repeat set to ${chalk.cyan(repeat)}`));
    const input = new midi.Input();
    // Read MIDI file into a buffer
    const midiFileBuffer = await readFileSync(midiFileName);
    const midiObject = midiFile.parseMidi(midiFileBuffer);
    let midiTrack = 0;
    if (midiObject.header.numTracks != 1) {
        console.log(chalk.red(`ERROR: Only one track is supported, your file has ${midiObject.header.numTracks} tracks`));
        // Prompt which track to use
        const midiTrackOptions = midiObject.tracks.map((track, index) => `Track ${index + 1}`);
        const { midiTrack: midiTrackTemp } = await inquirer.prompt({
            name: 'midiTrack',
            type: 'list',
            message: 'Select the track to use:',
            choices: midiTrackOptions,
            default: midiObject.tracks[0],
        });

        midiTrack = midiTrackOptions.indexOf(midiTrackTemp);
    }
    const events = midiObject.tracks[midiTrack];

    //get tempo from user via inquirer
    const { tempo } = await inquirer.prompt({
        name: 'tempo',
        type: 'input',
        message: 'Enter the tempo of the song in BPM:',
        default: 120,
        validate: (input) => {
            if (input == undefined) return true
            if (input.match(/^\d+$/)) {
                return true;
            }
            return 'Please enter a valid number';
        }
    });
    const ticksPerBeat = midiObject.header.ticksPerBeat;
    const ticksPerSecond = ticksPerBeat * tempo;

    console.log(chalk.bgWhite.black(`Using tempo ${chalk.cyan(tempo)}`));

    //Repeat though loop until event equals MidiOnNoteEvents consolelog the data and index to console
    let noteIndex = 0;
    for (let i = 0; i < events.length; i++) {
        const event = events[i];
        console.log(event)
        if (event.type === 'noteOn' || event.type === 'noteOff') {
            noteIndex = i;
            break;
        }
    }
    if (noteIndex === 0) {
        console.log(chalk.red('No note events found in the MIDI file'));
        process.exit(1);
    }
    console.log({ startReading: noteIndex, event: events[noteIndex] });
    //Delta time: the number of ticks since the previous event.
    //Message: the MIDI message.
    //Velocity: the velocity of the note.
    const output = new midi.Output();
    output.openPort(midiPortIndex);
    if (repeat) console.log(chalk.blue('Press Ctrl+C to stop'));

    if (repeat) {
        for (let i = noteIndex; i < events.length; i++) {
            const event = events[i];
            if (event.type === 'noteOn' || event.type === 'noteOff') {
                console.log(event);
                // if (event.type === 'noteOn') {
                //     output.sendMessage([144, event.noteNumber, event.velocity]);
                // } else if (event.type === 'noteOff') {
                //     output.sendMessage([128, event.noteNumber, event.velocity]);
                // }
                let deltaTime = events[i + 1].deltaTime;
                let waitTimeInMiliseonds = (tempo * deltaTime) / midiObject.header.ticksPerBeat;
                console.log(`Waiting ${chalk.cyan(waitTimeInMiliseonds)} miliseconds`);
                await sleep(waitTimeInMiliseonds);
            }
        }

    }
}