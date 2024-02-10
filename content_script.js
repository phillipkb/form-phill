const filterIgnored = (field => {
    const ignoredFields = ['hidden', 'submit', 'button']
    return !ignoredFields.includes(field.type)
})
const formatFields = (field, index) => {
    field.setAttribute('data-form-phill-id', index)

    return {
        id: field.id,
        value: field.value,
        name: field.name,
        placeholder: field.placeholder,
    }
}

const getFields = () => {
    const fieldNodes = document.querySelectorAll('input', 'textarea')
    const fields = Array.from(fieldNodes).filter(filterIgnored).map(formatFields)

    return fields
}

const syncFields = (fields) => {
    fields.forEach((field) => {
        const { id, value } = field
        const input = document.querySelector(`input[id=${id}]`)
        input.value = value
    })
}

chrome.runtime.onMessage.addListener(
    function (request, sender, sendResponse) {
        const { event } = request
        if (event === 'getFields') {
            const fields = getFields()
            sendResponse(fields)
        }

        if (event === 'syncFields') {
            syncFields(request.fields)
        }
    }
)
