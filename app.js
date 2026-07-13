document.addEventListener('DOMContentLoaded', () => {

    // CAMBIA ESTO por el subdominio de tu Space Docker viejo en Hugging Face
    const BACKEND_URL = 'https://elelimios-pibble-classifier.hf.space';

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

    function formatMarkdown(text) {
        return text
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            .replace(/### (.*?)\n/g, '<h3>$1</h3>')
            .replace(/## (.*?)\n/g, '<h2>$1</h2>');
    }

    uploadForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        if(!selectedFile) return;

        const formData = new FormData();
        formData.append('file', selectedFile); 

        loader.classList.remove('id-hidden');
        analysisOutputBox.classList.add('id-hidden');
        submitBtn.disabled = true;

        try {
            const response = await fetch(`${BACKEND_URL}/api/analyze`, {
                method: 'POST',
                body: formData
            });
            const data = await response.json();

            if (response.ok && data.status === "success") {
                analysisContent.innerHTML = formatMarkdown(data.analysis);
                analysisOutputBox.classList.remove('id-hidden');
                
                chatInput.disabled = false;
                sendBtn.disabled = false;
                chatBox.innerHTML = `<div class="message ai-msg">Clinical analysis completed successfully. You can now request interactive medical insights about your file: <b>${data.filename}</b>.</div>`;
            } else {
                alert(`Analysis Error: ${data.detail || 'Server integration failure'}`);
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
            const response = await fetch(`${BACKEND_URL}/api/chat`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ question: query })
            });
            const data = await response.json();

            if(response.ok) {
                appendMessage(data.answer, 'ai-msg', true);
            } else {
                appendMessage(`Error: ${data.detail || 'Inability to compute server inference.'}`, 'system-msg', false);
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