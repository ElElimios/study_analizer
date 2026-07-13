document.addEventListener('DOMContentLoaded', () => {

    // URL apuntando a la API nativa del Space en Hugging Face
    const BACKEND_URL = 'https://elelimios-anana-backend.hf.space/gradio_api/call';

    const dropZone = document.getElementById('dropZone');
    const fileInput = document.getElementById('fileInput');
    const fileInfo = document.getElementById('fileInfo');
    const submitBtn = document.getElementById('submitBtn');
    const uploadForm = document.getElementById('uploadForm');
    const loader = document.getElementById('loader');
    const analysisOutputBox = document.getElementById('analysisOutputBox');
    const analysisContent = document.getElementById('analysisContent');
    
    const chatBox = document.getElementById('chatBox');
    const chatInput = document.getElementById('chatInput');
    const sendBtn = document.getElementById('sendBtn');

    let selectedFile = null;

    dropZone.addEventListener('click', () => fileInput.click());

    ['dragenter', 'dragover'].forEach(eventName => {
        dropZone.addEventListener(eventName, (e) => {
            e.preventDefault();
            dropZone.classList.add('dragover');
        }, false);
    });

    ['dragleave', 'drop'].forEach(eventName => {
        dropZone.addEventListener(eventName, (e) => {
            e.preventDefault();
            dropZone.classList.remove('dragover');
        }, false);
    });

    dropZone.addEventListener('drop', (e) => {
        const dt = e.dataTransfer;
        const files = dt.files;
        if(files.length) handleFileSelection(files[0]);
    });

    fileInput.addEventListener('change', (e) => {
        if(e.target.files.length) handleFileSelection(e.target.files[0]);
    });

    function handleFileSelection(file) {
        if (file.type !== 'application/pdf') {
            alert('Please choose a valid PDF file.');
            return;
        }
        selectedFile = file;
        fileInfo.textContent = `${file.name} (${(file.size / (1024*1024)).toFixed(2)} MB)`;
        fileInfo.style.color = '#00df89';
        submitBtn.disabled = false;
    }

    // Procesa los asteriscos de Gemini y los convierte a HTML real estructurado
    function formatMarkdown(text) {
        return text
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            .replace(/### (.*?)\n/g, '<h3>$1</h3>')
            .replace(/## (.*?)\n/g, '<h2>$1</h2>');
    }

    // Función auxiliar para extraer el JSON limpio desde las respuestas asíncronas de Gradio
    async function getGradioResult(endpointName, eventId) {
        const resultResponse = await fetch(`${BACKEND_URL}/${endpointName}/${eventId}`);
        const textData = await resultResponse.text();
        
        // Las APIs modernas de Gradio devuelven Server-Sent Events (SSE). 
        // Esta línea limpia el prefijo "data: " y procesa la carga útil JSON.
        const lines = textData.split('\n');
        for (let line of lines) {
            if (line.startsWith('data: ')) {
                const jsonStr = line.replace('data: ', '').trim();
                const parsed = JSON.parse(jsonStr);
                // Retorna el primer elemento de la lista "data" del backend
                if (parsed && parsed[0] !== undefined) {
                    return parsed[0];
                }
            }
        }
        throw new Error("No se pudo parsear el flujo de datos de la API.");
    }

    uploadForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        if(!selectedFile) return;

        // Formato obligatorio: Gradio espera los archivos en el campo 'data'
        const formData = new FormData();
        formData.append('data', selectedFile); 

        loader.classList.remove('id-hidden');
        analysisOutputBox.classList.add('id-hidden');
        submitBtn.disabled = true;

        try {
            // 1. Iniciamos la petición de análisis
            const response = await fetch(`${BACKEND_URL}/analyze`, {
                method: 'POST',
                body: formData
            });
            const eventData = await response.json();

            if(response.ok && eventData.event_id) {
                // 2. Esperamos y extraemos el resultado procesado
                const actualResult = await getGradioResult('analyze', eventData.event_id);

                if (actualResult.status === "success") {
                    analysisContent.innerHTML = formatMarkdown(actualResult.analysis);
                    analysisOutputBox.classList.remove('id-hidden');
                    
                    chatInput.disabled = false;
                    sendBtn.disabled = false;
                    chatBox.innerHTML = `<div class="message ai-msg">Clinical analysis completed successfully. You can now request interactive medical insights about your file: <b>${actualResult.filename}</b>.</div>`;
                } else {
                    alert(`Analysis Error: ${actualResult.detail}`);
                }
            } else {
                alert('Error al inicializar la tarea en el servidor de Gradio.');
            }
        } catch (error) {
            console.error(error);
            alert('A networking error occurred while communicating with the Anana AI server.');
        } finally {
            loader.classList.add('id-hidden');
            submitBtn.disabled = false;
        }
    });

    async function sendMessage() {
        const query = chatInput.value.trim();
        if(!query) return;

        appendMessage(query, 'user-msg', false);
        chatInput.value = '';

        chatInput.disabled = true;
        sendBtn.disabled = true;

        try {
            // Formato obligatorio para el chat: Enviar el string envuelto en la lista 'data'
            const response = await fetch(`${BACKEND_URL}/chat`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ data: [query] })
            });
            const eventData = await response.json();

            if(response.ok && eventData.event_id) {
                // Obtenemos la respuesta generada por el bot
                const actualResult = await getGradioResult('chat', eventData.event_id);
                appendMessage(actualResult.answer, 'ai-msg', true);
            } else {
                appendMessage('Error: No se pudo obtener respuesta del backend en Gradio.', 'system-msg', false);
            }
        } catch (error) {
            console.error(error);
            appendMessage('Network breakdown while connecting to server.', 'system-msg', false);
        } finally {
            chatInput.disabled = false;
            sendBtn.disabled = false;
            chatInput.focus();
        }
    }

    function appendMessage(text, className, isAI) {
        const msgDiv = document.createElement('div');
        msgDiv.className = `message ${className}`;
        
        if (isAI) {
            msgDiv.innerHTML = formatMarkdown(text);
        } else {
            msgDiv.textContent = text;
        }
        
        chatBox.appendChild(msgDiv);
        chatBox.scrollTop = chatBox.scrollHeight;
    }

    sendBtn.addEventListener('click', sendMessage);
    chatInput.addEventListener('keydown', (e) => {
        if(e.key === 'Enter') sendMessage();
    });
});