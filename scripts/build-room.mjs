import { createCanvas } from '@napi-rs/canvas';
import { mkdir, writeFile } from 'node:fs/promises';
import { drawRoomBackground } from '../room-background.js';

const pixels=createCanvas(480,320);
pixels.getContext('2d').scale(.5,.5);
drawRoomBackground(pixels.getContext('2d'));
const room = createCanvas(960, 640), ctx=room.getContext('2d');
ctx.imageSmoothingEnabled=false;ctx.drawImage(pixels,0,0,960,640);
const destination = new URL('../assets/rooms/cat-room/', import.meta.url);
await mkdir(destination, { recursive: true });
await writeFile(new URL('cat-room-structure.png', destination), room.toBuffer('image/png'));
console.log('Built assets/rooms/cat-room/cat-room-structure.png');
