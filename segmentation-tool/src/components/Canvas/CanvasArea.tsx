import React, { useRef, useEffect, useState } from "react";
import * as fabric from "fabric";
import { Upload, message } from "antd";
import { UploadOutlined } from "@ant-design/icons";

const CanvasArea: React.FC = () => {
	const canvasRef = useRef<HTMLCanvasElement>(null);
	const fabricCanvasRef = useRef<fabric.Canvas | null>(null);
	const undoStack = useRef<string[]>([]); // Pilha de estados para Undo
	const redoStack = useRef<string[]>([]); // Pilha auxiliar (não terá Redo)
	const [isImageUploaded, setIsImageUploaded] = useState(false);
	const [backgroundImage, setBackgroundImage] = useState<string | null>(null);
	const [brushColor, setBrushColor] = useState("#FF0000");
	const [brushWidth, setBrushWidth] = useState(5);
	const [isBrushing, setIsBrushing] = useState(true);

	// 🚀 Sempre que `undoStack` muda, re-renderiza o Canvas
	useEffect(() => {
		if (!canvasRef.current || !isImageUploaded) return;

		const canvasDiv = document.getElementById("canvas-div");
		if (!canvasDiv) {
			console.error("Elemento canvas-div não encontrado!");
			return;
		}

		const width = canvasDiv.clientWidth;
		const height = canvasDiv.clientHeight;

		// Criar novo canvas
		const canvas = new fabric.Canvas(canvasRef.current, {
			isDrawingMode: true,
			selection: false,
			backgroundColor: "transparent",
			width,
			height,
		});

		fabricCanvasRef.current = canvas;

		// Configurar o pincel
		canvas.freeDrawingBrush = new fabric.PencilBrush(canvas);
		canvas.freeDrawingBrush.color = brushColor;
		canvas.freeDrawingBrush.width = brushWidth;

		// 📝 Se há estados salvos, restaurar o último estado
		if (undoStack.current.length > 0) {
			const lastState = undoStack.current[undoStack.current.length - 1];
			canvas.loadFromJSON(lastState, () => {
				canvas.renderAll();
				canvas.forEachObject((obj) => obj.setCoords());
			});
		}

		const saveState = () => {
			const currentState = JSON.stringify(canvas.toJSON());
			if (undoStack.current.length === 0 || undoStack.current[undoStack.current.length - 1] !== currentState) {
				undoStack.current.push(currentState);
				redoStack.current = []; // Sempre limpar a pilha auxiliar ao salvar um novo estado
			}
		};

		canvas.on("object:modified", saveState);
		canvas.on("path:created", saveState);

		return () => {
			canvas.dispose();
		};
	}, [isImageUploaded]);

	// Atualizar pincel ao mudar cor ou tamanho
	useEffect(() => {
		if (fabricCanvasRef.current) {
			const canvas = fabricCanvasRef.current;
			if (canvas.freeDrawingBrush) {
				canvas.freeDrawingBrush.color = brushColor;
				canvas.freeDrawingBrush.width = brushWidth;
			}
		}
	}, [brushColor, brushWidth]);

	const handleImageUpload = (file: File) => {
		const reader = new FileReader();

		reader.onload = (e) => {
			if (!e.target?.result) {
				console.error("Erro ao carregar a imagem.");
				message.error("Erro ao carregar a imagem.");
				return;
			}

			// Define a imagem como background da div
			setBackgroundImage(e.target.result as string);
			setIsImageUploaded(true);
			message.success("Imagem de fundo definida com sucesso!");
		};

		reader.onerror = () => {
			console.error("Erro ao ler o arquivo com FileReader.");
			message.error("Erro ao processar o arquivo.");
		};

		reader.readAsDataURL(file);
		return false;
	};

	const toggleBrushing = () => {
		if (fabricCanvasRef.current) {
			const canvas = fabricCanvasRef.current;
			canvas.isDrawingMode = !canvas.isDrawingMode;
			setIsBrushing(canvas.isDrawingMode);
		}
	};

	const undo = () => {
		if (fabricCanvasRef.current && undoStack.current.length > 1) {
			const lastState = undoStack.current.pop(); // Remove o estado atual
			if (lastState) {
				redoStack.current.push(lastState); // Move para a pilha auxiliar
			}

			const previousState = undoStack.current[undoStack.current.length - 1];

			fabricCanvasRef.current.loadFromJSON(previousState).then(() => {
				fabricCanvasRef.current!.renderAll();
			});

		} else {
			message.warning("Nada para desfazer.");
		}
	};

	return (
		<div
			id="canvas-div"
			style={{
				height: "60%",
				width: "100%",
				borderRadius: "20px",
				position: "relative",
				backgroundImage: backgroundImage ? `url(${backgroundImage})` : "none",
				backgroundSize: "cover",
				backgroundPosition: "center",
				backgroundRepeat: "no-repeat",
			}}
		>
			{!isImageUploaded ? (
				<Upload beforeUpload={handleImageUpload} showUploadList={false}>
					<button
						style={{
							padding: "10px 20px",
							backgroundColor: "#5E4AE3",
							color: "#fff",
							borderRadius: "8px",
							border: "none",
							cursor: "pointer",
							marginBottom: "10px",
						}}
					>
						<UploadOutlined /> Upload Image
					</button>
				</Upload>
			) : (
				<>
					<canvas
						ref={canvasRef}
						style={{
							position: "absolute",
							top: 0,
							left: 0,
							width: "100%",
							height: "100%",
						}}
					/>
					<div style={{ marginTop: "10px" }}>
						<input
							type="color"
							value={brushColor}
							onChange={(e) => setBrushColor(e.target.value)}
						/>
						<input
							type="range"
							min={1}
							max={50}
							value={brushWidth}
							onChange={(e) => setBrushWidth(Number(e.target.value))}
						/>
						<button onClick={toggleBrushing}>{isBrushing ? "Disable Brush" : "Enable Brush"}</button>
						<button onClick={undo}>Undo</button>
					</div>
				</>
			)}
		</div>
	);
};

export default CanvasArea;
