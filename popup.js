const getActiveTab = async () => {
    const [tab] = await chrome.tabs.query({ active: true, lastFocusedWindow: true })
    return tab
}

const getFields = async () => {
    const tab = await getActiveTab()
    const storageKey = tab.url

    const fields = await chrome.storage.local.get([storageKey])
    let fieldValues = fields[storageKey]

    if (!fieldValues) {
        fieldValues = await chrome.tabs.sendMessage(tab.id, { event: "getFields" })
    }

    return fieldValues
}

const syncFields = async () => {
    const tab = await getActiveTab()
    const fields = await getFields()
    await chrome.tabs.sendMessage(tab.id, { event: "syncFields", fields })
}

const clearStorage = async () => {
    chrome.storage.local.clear(function () {
        if (chrome.runtime.lastError) {
            console.error(`Error clearing local storage: ${chrome.runtime.lastError}`);
        } else {
            console.log('Local storage cleared');
        }
    });
    
    // remove current fields and fetch from content script
    document.querySelectorAll('.fp_input-block, .fp_button-block').forEach(node => node.remove())
    await makeFields()
}

const dropField = async (event) => {
    const { containerId, targetFieldId } = event.target.dataset
    const fields = await getFields()

    const filteredFields = fields.filter(field => field.id !== targetFieldId)
    writeToStorage(filteredFields)

    const targetField = document.querySelector(`#${containerId}`)
    targetField.remove()
}

const writeOnChange = async (event) => {
    const { value: newValue, id } = event.target
    const fields = await getFields()
    const updatedFields = fields.map((field) => {
        if (field.id === id) {
            field.value = newValue
        }
        return field
    })
    await writeToStorage(updatedFields)
}

const writeToStorage = async (fields) => {
    const tab = await getActiveTab()
    await chrome.storage.local.set({ [tab.url]: fields })
}

const makeElement = (config) => {
    const { element, className, value, attributes, innerText, eventListener, eventAction, id } = config
    const node = document.createElement(element)

    if (id) node.id = id
    if (className) node.classList.add(className)
    if (value) node.value = value
    if (innerText) node.innerText = innerText
    if (eventAction && eventListener) node.addEventListener(eventAction, eventListener)
    if (attributes) {
        attributes.forEach(([attribute, value]) => {
            node.setAttribute(attribute, value)
        })
    }

    return node
}

const randomId = () => Math.random().toString(36).substring(2, 15)

const makeFields = async () => {
    const fields = await getFields('fields')

    const container = document.querySelector("#fp_container")

    fields.forEach((field) => {
        const inputBlock = makeElement({ element: 'div', className: 'fp_input-block', id: randomId() })

        const inputWrapper = makeElement({ element: 'div', className: 'fp_input-wrapper' })
        const labelNode = makeElement({ element: 'label', className: 'fp_label', innerText: field.name || field.placeholder })
        const dropIcon = makeElement({
            element: 'span',
            className: 'fp_drop-icon',
            innerText: 'X',
            eventListener: dropField,
            eventAction: 'click',
            attributes: [['data-container-id', inputBlock.id], ['data-target-field-id', field.id]]
        })
        const inputNode = makeElement({
            element: 'input',
            className: 'fp_input',
            value: field.value,
            eventListener: writeOnChange,
            eventAction: 'input',
            attributes: [['id', field.id], ['placeholder', field.placeholder]]
        })
        inputWrapper.append(inputNode, dropIcon)
        inputBlock.append(labelNode, inputWrapper)
        container.append(inputBlock)
    })

    const buttonBlock = makeElement({ element: 'div', className: 'fp_button-block' })
    const syncButton = makeElement({
        element: 'button',
        className: 'fp_button',
        innerText: 'sync',
        eventListener: syncFields,
        eventAction: 'click'
    })
    const clearButton = makeElement({
        element: 'button',
        className: 'fp_button',
        innerText: 'clear memory',
        eventListener: clearStorage,
        eventAction: 'click'
    })

    buttonBlock.append(syncButton, clearButton)
    container.append(buttonBlock)
}

makeFields()
