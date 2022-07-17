if (typeof Element === 'function' && !HTMLSlotElement.prototype.assign) {
	let { attachShadow } = Element.prototype

	/** slot template to be cloned to create private slots. */
	let internalSlot = document.createElement('slot')

	/** Space-like character used to create unique, public slot names. */
	let slotChar = String.fromCharCode(0x200C)

	/** Space-like character used to create unique, private slot names. */
	let slitChar = String.fromCharCode(0x2060)

	/** Map between publicly assigned nodes and private slots. */
	let slitMap = new WeakMap<AssignableNode, AssignableSlit>()

	/** Map between shadow roots and private implementation details. */
	let rootDataMap = new WeakMap<ShadowRoot, RootData>()

	/** Private implementation details for shadow roots. */
	let rootData: RootData

	/** Map between public slot elements and private implementation details. */
	let slotDataMap = new WeakMap<HTMLSlotElement, SlotData>()

	/** Private implementation details for slot elements. */
	let slotData: SlotData

	/** Checking function used to validate potential shadow roots. */
	let isShadowRoot = isPrototypeOf.bind(ShadowRoot.prototype)

	/** Instance of a shadow root. */
	let shadowRoot: ShadowRoot

	/** Instance of a public slot element. */
	let slot: HTMLSlotElement

	/** Index of an Assignable Node within Iterable, Assignable Nodes. */
	let tick: number

	/** Node extracted from Iterable Nodes. */
	let node: AssignableNode

	/** Instance of a private slot element. */
	let slit: AssignableSlit

	/** Root of the given slot element. */
	let root: DocumentOrShadowRoot

	/** Fragment used to transfer private slot elements. */
	let removals = new DocumentFragment()

	internalSlot.setAttribute('style', 'display:contents!important')

	// polyfill attachShadow to handle any slot changes
	Object.assign(Element.prototype, {
		attachShadow(this: Element, init: ShadowRootInit) {
			shadowRoot = attachShadow.call(this, init)

			if (init && init.slotAssignment === 'manual') {
				let data = { tick: 0 }

				rootDataMap.set(shadowRoot, data)

				shadowRoot.addEventListener('slotchange', ({ target }) => {
					if ((<HTMLSlotElement>target).name === '') {
						(<HTMLSlotElement>target).name = slotChar.repeat(++data.tick)
					}
				}, true)
			}

			return shadowRoot
		},
	})

	Object.assign(
		HTMLSlotElement.prototype,
		{
			assign(this: HTMLSlotElement, ...nodes: AssignableNode[]) {
				/** Given slot element. */
				slot = this

				/** Internally assigned slots and cloned text. */
				slotData = slotDataMap.get(slot)!

				// if the slot has existing data
				if (slotData) {
					// remove all previous private slots from the given public slot
					removals.append(...slotData.slits.splice(0))

					// remove all attributes from previous nodes
					while (node = slotData.nodes.pop()!) (<Element>node).removeAttribute && (<Element>node).removeAttribute('slot')
				}

				// return if there are nodes to assign
				if (!nodes.length) return

				/** Root of the given slot element. */
				root = <DocumentOrShadowRoot><unknown>slot.getRootNode()

				// return if the slot does not belong to a ShadowRoot
				if (!isShadowRoot(root)) return

				/** Internal data for the root of the given slot. */
				rootData = rootDataMap.get(root)!

				// conditionally assign root data
				if (!rootData) {
					rootDataMap.set(root, rootData = {
						tick: 0,
					})
				}

				// conditionally assign slot data
				if (!slotData) {
					slotDataMap.set(slot, slotData = {
						name: slotChar.repeat(++rootData.tick),
						slits: [],
						nodes: [],
					})
				}

				// for each node being assigned and its given index
				for (<any>tick in nodes) {
					node = nodes[tick]
					slit = slitMap.get(node)!

					if (node instanceof Text) {
						if (!slit) {
							/** Inner slot as a cloned text node (if not already stored). */
							slit = <Text>node.cloneNode(true)

							// mimic changes to the original node
							node.addEventListener('DOMNodeRemoved', () => slit.remove())
							node.addEventListener('DOMCharacterDataModified', () => (<Text>slit).data = (<Text>node).data)
						}
					} else {
						if (!slit) {
							/** Inner slot as a cloned internal slot. */
							slit = <HTMLSlotElement>internalSlot.cloneNode()

							// set the inner slot name as the slot name with additional characters
							slit.name = slotData.name + slitChar.repeat(tick + 1)
						}

						// assign or re-assign the slot name to the node
						node.slot = (<HTMLSlotElement>slit).name
					}

					// store the slot for the node
					slitMap.set(node, slit)

					// add the inner slot to the list of nodes
					slotData.slits.push(slit)
					slotData.nodes.push(node)
				}

				// assign or re-assign the slot name to the given slot
				if (slot.name !== slotData.name) slot.name = slotData.name

				// append the list of nodes to the given slot
				slot.append(...slotData.slits)
			},
			assignedNodes(this: HTMLSlotElement) {
				/** Given slot element. */
				slot = this

				/** Internally assigned slots and cloned text. */
				slotData = slotDataMap.get(slot)!

				return slotData ? slotData.nodes.filter(node => node.isConnected) : []
			},
			assignedElements(this: HTMLSlotElement) {
				/** Given slot element. */
				slot = this

				/** Internally assigned slots and cloned text. */
				slotData = slotDataMap.get(slot)!

				return slotData ? slotData.nodes.filter(node => node.isConnected && node.nodeType === 1) : []
			},
		}
	)
}

/** Publicly assigned node. */
export type AssignableNode = Element | Text

/** Privately assigned node. */
export type AssignableSlit = HTMLSlotElement | Text

/** Implementation details for shadow roots. */
export interface RootData {
	/** Counter for generating unique slot names for the given shadow root. */
	tick: number
}

/** Implementation details for slot elements. */
export interface SlotData {
	/** Name used by the public slot. */
	name: string

	/** Publicly assigned nodes. */
	nodes: AssignableNode[]

	/** Privately assigned nodes. */
	slits: AssignableSlit[]
}

/** Checks whether the given node is a prototype. */
declare let isPrototypeOf: {
	bind<T>(target: T): {
		(value: any): value is T
	}
}
