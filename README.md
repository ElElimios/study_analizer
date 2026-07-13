**Anana AI — Clinical Backend Engine**
Anana AI is a lightweight production backend built to process, analyze, and query medical laboratory PDF reports using advanced generative AI.

---------------------Technical Architecture & Tools
-Core Runtime & API: FastAPI provides the low-latency HTTP framework, utilizing Uvicorn as the ASGI production web server.

-Artificial Intelligence: The modern Google GenAI SDK communicates directly with production Gemini 2.5 Flash models for medical semantic processing and contextual chat evaluation.

-Document Parsing: PyPDF executes safe, local extraction of document strings directly inside isolated memory buffers.

-Data Integrity: Pydantic guarantees deterministic payload validation for incoming requests and conversational schemas.

-Infrastructure: Wrapped natively inside a highly efficient Docker environment running on decoupled cloud container fabrics to guarantee continuous service availabilit.

--------------------- HAD TO FIX
-Mitigating Cloud Network Congestion
Deploying frontend systems onto distributed infrastructure like Vercel meant requests frequently originated from shared enterprise IP ranges, triggering temporary 503 Service Unavailable or 429 High Demand errors from upstream Google AI nodes. To counter this, a robust internal exponential backoff retry mechanism was engineered directly into the model inference logic. If the AI engine hits a high-demand spike, it pauses dynamically and safely retries the task before presenting the final processed data to the end-user. (BASICALLY HIGH DEMAND ERRORS THAT MADE IT CRASH)

--------------------- VS CODE
Used VS code and programming languages like HTML, CSS, JAVASCRIPT, PYTHON.
Created Dockerfile to make it work on Hugging faces.

----------------------- HOW IT WORKS
The system seamlessly extracts raw textual components from incoming documents, structures anomalies or out-of-range clinical values, and provides a conversational contextual interface. This architecture serves as a dedicated engine feding client-side applications like GitHub Pages or Vercel deployments securely via structured HTTP interfaces.

I hope you like it :D
