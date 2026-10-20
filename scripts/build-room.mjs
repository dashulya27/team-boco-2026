import { createCanvas } from '@napi-rs/canvas';
import { mkdir, writeFile } from 'node:fs/promises';
import { drawRoomBackground } from '../room-background.js';

const room = createCanvas(960, 640);
drawRoomBackground(room.getContext('2d'));
const destination = new URL('../assets/rooms/cat-room/', import.meta.url);
await mkdir(destination, { recursive: true });
await writeFile(new URL('cat-room-structure.png', destination), room.toBuffer('image/png'));
console.log('Built assets/rooms/cat-room/cat-room-structure.png');
