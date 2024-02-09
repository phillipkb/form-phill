
const getFields = () => {
    const fieldNodes = document.querySelectorAll('input')

    const fields = Array.from(fieldNodes).filter(e => e.type !== 'hidden').map((field, index) => {
        field.setAttribute('data-form-phill-id', index)

        return {
            id: field.id,
            value: field.value,
            name: field.name,
            placeholder: field.placeholder,
        }
    })

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
