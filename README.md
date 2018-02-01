# Wallop with whistles

Inspired by: http://pedroduarte.me/wallop

examples en route...

## Install

`npm install spon-slide` or `yarn add spon-slide`

### Import

`import Slide from 'spon-slide'`

### Start

```
const slide = new Slide(element, options)
slide.init()
```

### Options:

```
animationType: {String} - animation, transition, custom
selector: {String} - css selector
previousButton: {String} - css selector
nextButton: {String} - css selector
activeClass: {String} - class name
loop: {Boolean}
delay: {Number}
wrap: {Boolean}
dots: {Boolean}
startingIndex: {Function(items)} - must return {Number}
promiseBefore: {Boolean}
paginationParent: {Boolean}
dotsWrapper: {String} - html
dotsButtons: {Function(items)} - must return an array eg: ['<button></button>','<button></button>']
```

### Events:

Called in order

`const $n = new Slide($HTML, {})`

```
$n.on('spon:prev', ({props}) => ()) - on prev click
$n.on('spon:next', ({props}) => ()) - on next click
$n.on('spon:before', (props, resolve) => ()) - before promise // only triggered when promiseBefore === true
$n.on('spon:change', ({props}) => ()) - on change
$n.on('spon:after', ({props}) => ()) - after animation
```

### API:

```
$n.init() - start
$n.reset() - reset everything
$n.destroy() - kill it all
$n.next() - goto next
$n.prev() - goto prev
$n.goTo(n) - go to index
$n.setOptions(o) - update optios object
```

### HTML:

```
<div class="relative overflow-hidden data-ui="slide">
	<ul>
		<li data-slide-item>{{ loop.index }}</li>
		<li data-slide-item>{{ loop.index }}</li>
		<li data-slide-item>{{ loop.index }}</li>
	</ul>
	<a href="#0" data-slide-prev>prev</a>
	<a href="#0" data-slide-next>next</a>
</div>
```

### Example CSS:

```
[data-slide-item='hide-prev'],
[data-slide-item='hide-prev'] {
	visibility: visible;
	z-index: 2;
	animation: fadeOut 450ms cubic-bezier(0.455, 0.03, 0.515, 0.955) both;
}

[data-slide-item='show-prev'],
[data-slide-item='show-next'] {
	z-index: 1;
}

.c-slide__item--current {
	position: relative;
	visibility: visible;
}
```
