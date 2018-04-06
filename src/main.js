import mitt from 'mitt'
import fromTo from 'mud-from-to'

function debounce(func, wait, immediate) {
	let timeout
	return function() {
		let context = this,
			args = arguments
		let later = function() {
			timeout = null
			if (!immediate) func.apply(context, args)
		}
		let callNow = immediate && !timeout
		clearTimeout(timeout)
		timeout = setTimeout(later, wait)
		if (callNow) func.apply(context, args)
	}
}

/**
 *
 * @class Expander
 * @extends  Concert
 * @param  {HTMLElement} el : the form to validate
 * @param  {Object} options : accordion options
 * 									activeIndex: Number // Set the inital active pane
 * 									closeOthers: Boolean // set to true to ensure only one pane is ever open
 * 									selector: String // css selector for each accordion button
 * 									name: String // name used for accessibility props
 * 									buttonActiveClass: String // active button class
 * 									contentActiveClass: String // active content class
 * 									duration: Number // Animation duration
 * 									easing: Function // easing function to apply
 */
export default class Expander {
	defaults = {
		activeIndex: null,
		closeOthers: false,
		open: false,
		selector: '[data-accordion-btn]',
		name: 'accordion',
		init: true,
		buttonActiveClass: 'is-active',
		contentActiveClass: 'is-expanded',
		duration: 300,
		easing: function defaultEasing(t, b, c, d) {
			if ((t /= d / 2) < 1) return c / 2 * t * t + b
			return -c / 2 * (--t * (t - 2) - 1) + b // eslint-disable-line
		}
	}

	/**
	 *
	 * @function constructor
	 * @param  {HTMLElement} el : the form to validate
	 * @param  {Object} options : Expander options
	 * @return Expander
	 */
	constructor(el, options = {}) {
		this.options = { ...this.defaults, ...options }
		this.$el = el
		this.panes = []
		this.current = null
		this.options.init && this.init()

		Object.assign(this, mitt())

		return this
	}

	/**
	 * The 'change' event handler
	 *
	 * @function clickHandle
	 * @param  {Object} event : event object
	 * @param  {HTMLElement} element : the input that's changed
	 * @return Void
	 */
	clickHandle = ($button, event) => {
		event.preventDefault()
		const { accordionIndex } = $button.dataset
		const item = this.panes[accordionIndex]
		item.state = item.machine[item.state].CLICK

		item.state === 'open'
			? this.expand(accordionIndex)
			: this.collapse(accordionIndex)
	}

	/**
	 * Setup panels, add accessibility attributes
	 *
	 * @return {void}
	 */
	createPanels = () => {
		const {
			buttonActiveClass,
			contentActiveClass,
			activeIndex,
			open,
			name
		} = this.options

		this.panes = [...this.$el.querySelectorAll(this.options.selector)].map(
			($button, index) => {
				$button.setAttribute('data-accordion-index', index)
				const { target } = $button.dataset
				const $target = this.$el.querySelector(target)
				const state = open
					? true
					: (!open && index === activeIndex ? true : false) ? true : false
				$button.setAttribute('aria-expanded', state)
				$button.setAttribute('aria-selected', state)
				$button.setAttribute('aria-controls', `${name}-${index}`)
				if (state) {
					$button.classList.add(buttonActiveClass)
					$target.classList.add(contentActiveClass)
				}
				$target.setAttribute('data-enhanced', true)
				$target.setAttribute('aria-labelledby', `${name}-${index}`)
				$target.setAttribute('aria-hidden', !state)
				$target.setAttribute('role', 'tabpanel')

				const obj = {
					$button,
					$target,
					index,
					open: state,
					isRunning: false,
					state: state ? 'open' : 'close',
					machine: {
						open: { CLICK: 'close' },
						close: { CLICK: 'open' }
					}
				}
				if (activeIndex === index) {
					this.current = obj
				}

				return obj
			}
		)
	}

	animate = (start, end, $target) => {
		const { duration, easing } = this.options

		return fromTo(
			{
				start,
				end,
				duration,
				easing
			},
			v => ($target.style.height = `${v}px`)
		)
	}

	/**
	 * function called after the transition has completed
	 *
	 * @return {Expander}
	 */
	onEnd = pane => {
		const { $target, $button, open } = pane
		$target.style.willChange = ''
		$target.style.height = ''
		$target.style.display = ''
		$button.setAttribute('aria-expanded', open)
		$button.setAttribute('aria-selected', open)
		$target.setAttribute('aria-hidden', !open)
		return this
	}

	/**
	 * Bind event listeners
	 *
	 * @function addEvents
	 * @return {Expander}
	 */
	addEvents = () => {
		this.panes.forEach(({ $button }) => {
			$button.addEventListener(
				'click',
				debounce(this.clickHandle.bind(this, $button), 150)
			)
			$button.addEventListener(
				'touchstart',
				this.clickHandle.bind(this, $button)
			)
		})

		return this
	}

	/**
	 * Unbind event listeners
	 *
	 * @function removeEvents
	 * @return {Expander}
	 */
	removeEvents = () => {
		this.panes.forEach(({ $button }) => {
			$button.removeEventListener('click', this.clickHandle)
			$button.removeEventListener('touchstart', this.clickHandle)
		})

		return this
	}

	/**
	 *
	 * @function expand
	 * @param  {Number} index : the form to validate
	 * @return {Expander}
	 */
	expand = index => {
		const pane = this.panes[index]

		const { buttonActiveClass, contentActiveClass, closeOthers } = this.options

		const { index: oldIndex } = this.current
		if (
			closeOthers &&
			this.current &&
			oldIndex !== parseInt(index) &&
			this.current.open
		) {
			this.current.state = this.current.machine[this.current.state].CLICK
			this.collapse(oldIndex)
		}

		const { $target, $button } = pane
		pane.open = true
		this.current = pane
		$target.style.display = 'block'
		$target.style.height = ''
		const { height } = $target.getBoundingClientRect()

		$target.style.height = 0
		$target.style.willChange = 'height'

		this.emit('open', { pane, index, panes: this.panes })

		this.animate(0, Math.round(height), $target).then(() => {
			this.onEnd(pane)
			$button.classList.add(buttonActiveClass)
			$target.classList.add(contentActiveClass)
			this.emit('after:open', { pane, index, panes: this.panes })
		})

		return this
	}

	/**
	 *
	 * @function expand
	 * @param  {Number} index : the form to validate
	 * @return {Expander}
	 */
	collapse = index => {
		const pane = this.panes[index]

		const { buttonActiveClass, contentActiveClass } = this.options

		const { $target, $button } = pane
		pane.open = false
		const { height } = $target.getBoundingClientRect()
		$target.style.height = `${height}px`
		$target.style.willChange = 'height'

		this.emit('close', { pane, index, panes: this.panes })

		this.animate(Math.round(height), 0, $target).then(() => {
			this.onEnd(pane)
			$button.classList.remove(buttonActiveClass)
			$target.classList.remove(contentActiveClass)
			this.emit('after:close', { pane, index, panes: this.panes })
		})
		return this
	}

	/**
	 * Initalize accordion, add aria attributes, bind events, open/close etc etc
	 *
	 * @return {Expander}
	 */
	init = () => {
		this.createPanels()
		this.addEvents()
		this.$el.setAttribute('role', 'tablist')
		this.$el.setAttribute('aria-multiselectable', this.options.closeOthers)

		return this
	}

	/**
	 * Initalize accordion, add aria attributes, bind events, open/close etc etc
	 *
	 * @return {Expander}
	 */
	destroy = () => {
		const { buttonActiveClass, contentActiveClass } = this.options
		this.removeEvents()
		this.$el.removeAttribute('role')
		this.$el.removeAttribute('aria-multiselectable')
		this.panes.forEach(({ $button, $target }) => {
			$button.classList.remove(buttonActiveClass)
			$button.removeAttribute('aria-expanded')
			$button.removeAttribute('aria-selected')
			$button.removeAttribute('aria-controls')
			$button.removeAttribute('role', 'tab')
			$target.removeAttribute('aria-hidden')
			$target.removeAttribute('aria-labelledby')
			$target.removeAttribute('role', 'tabpanel')
			$target.removeAttribute('data-enhanced', true)
			$target.classList.remove(contentActiveClass)
			$target.removeAttribute('style')
			this.off('*')
		})

		return this
	}
}
