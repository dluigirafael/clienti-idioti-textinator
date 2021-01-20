const { createWorker, createScheduler } = Tesseract;
const dlBtn = document.getElementById("download-pdf");
const board = document.getElementById("board");
const log = document.getElementById("log");
const clearBtn = document.getElementById("clear");
const lang = document.getElementById("langsel");
const scheduler = createScheduler();

const worker1 = createWorker({
  logger: (m) => progressUpdate(m),
});

// gotta go fast
const worker2 = createWorker({
  logger: (m) => progressUpdate(m),
});

function progressUpdate(packet) {
  if (log.firstChild && log.firstChild.status === packet.status) {
    if ("progress" in packet) {
      lang.disabled = true;
      var progress = log.firstChild.querySelector("progress");
      progress.value = packet.progress;
    }
  } else {
    var line = document.createElement("div");
    line.status = packet.status;
    var status = document.createElement("div");
    status.className = "status";
    status.appendChild(document.createTextNode(packet.status));
    line.appendChild(status);

    if ("progress" in packet) {
      var progress = document.createElement("progress");
      progress.value = packet.progress;
      progress.max = 1;
      line.appendChild(progress);
    }

    log.insertBefore(line, log.firstChild);
  }
  if (packet.status == "recognizing text" && packet.progress == 1) {
    dlBtn.disabled = false;
    clearBtn.disabled = false;
    lang.disabled = false;
  }
}

async function recognizeFile(file) {
  await worker1.load();
  // await worker2.load();

  await worker1.loadLanguage(lang.value);
  await worker1.initialize(lang.value);

  // await worker2.loadLanguage(lang.value);
  // await worker2.initialize(lang.value);
  scheduler.addWorker(worker1);
  // scheduler.addWorker(worker2);

  // const {
  //   data: { text },
  // } = await worker.recognize(file);
  // board.innerHTML = text;

  const results = await Promise.all(
    Array(1)
      .fill(0)
      .map(() => scheduler.addJob("recognize", file))
  );

  board.innerHTML = results[0].data.text;

  //   await worker.terminate();
}

const downloadPDF = async () => {
  const filename = "tesseract-ocr-result.pdf";
  const { data } = await worker1.getPDF("Result text client idiot");
  const blob = new Blob([new Uint8Array(data)], { type: "application/pdf" });
  if (navigator.msSaveBlob) {
    // IE 10+
    navigator.msSaveBlob(blob, filename);
  } else {
    const link = document.createElement("a");
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute("download", filename);
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  }
};

dlBtn.addEventListener("click", downloadPDF);
clearBtn.addEventListener("click", () => {
  board.innerHTML = "";
  log.innerHTML = "";
});

