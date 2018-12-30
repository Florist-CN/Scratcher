# Scratcher

A scratchcard simulater based on canvas

## Instlatation

```console
npm install scratcher --S
```

## Usage

```javascript
import { Scratcher } from 'scratcher';
import mask from './mask.jpg';
import back from './back.jpg';

const container = document.getElementById('container');
const scratcher = new Scratcher({
    container: container,
    backSrc: back,          // or backSrc:'/back.jpg'
    maskSrc: mask,
    clearThrehold: 0.3,     // auto clear when only 30% remain 
    penWidth: 50,
    penBlur: 50
});

// trigger when mask is cleared
scratcher.onClear(() => alert('cleared'));

// reset the canvas
document.getElementById('button').addEventListener('click', () => scratcher.init()); 
```

