import React, { useRef, useEffect, useState } from "react";
import * as fabric from "fabric";
import { Upload, message } from "antd";
import { UploadOutlined } from "@ant-design/icons";

const CanvasArea: React.FC = () => {
	const canvasRef = useRef<HTMLCanvasElement>(null);
	const fabricCanvasRef = useRef<fabric.Canvas | null>(null);

	// Pilhas de Undo/Redo
	const undoStack = useRef<string[]>([]);
	const redoStack = useRef<string[]>([]);

	// Estados principais
	const [isImageUploaded, setIsImageUploaded] = useState(false);
	const [backgroundImage, setBackgroundImage] = useState<string | null>(null);
	const [brushColor, setBrushColor] = useState("#FF0000");
	const [brushWidth, setBrushWidth] = useState(5);

	// Modo brush e modo polígono
	const [isBrushing, setIsBrushing] = useState(true);
	const [isPolygonMode, setIsPolygonMode] = useState(false);

	// Estados/Referências para POLÍGONO
	const pointArray = useRef<fabric.Circle[]>([]);
	const lineArray = useRef<fabric.Line[]>([]);
	const activeLine = useRef<fabric.Line | null>(null);
	const activeShape = useRef<fabric.Polygon | null>(null);

	// NOVO: estado para BORRACHA
	const [isEraserMode, setIsEraserMode] = useState(false);

	useEffect(() => {
		if (!canvasRef.current || !isImageUploaded) return;

		// Só inicializa o canvas 1x quando a imagem for carregada
		const canvasDiv = document.getElementById("canvas-div");
		if (!canvasDiv) {
			console.error("Elemento canvas-div não encontrado!");
			return;
		}

		const width = canvasDiv.clientWidth;
		const height = canvasDiv.clientHeight;

		// Cria o canvas
		const canvas = new fabric.Canvas(canvasRef.current, {
			isDrawingMode: true,
			selection: false,
			backgroundColor: "transparent",
			width,
			height,
		});
		fabricCanvasRef.current = canvas;

		// Configurar o brush inicialmente
		canvas.freeDrawingBrush = new fabric.PencilBrush(canvas);
		canvas.freeDrawingBrush.color = brushColor;
		canvas.freeDrawingBrush.width = brushWidth;

		// Carregar último estado se existir
		if (undoStack.current.length > 0) {
			const lastState = undoStack.current[undoStack.current.length - 1];
			canvas.loadFromJSON(lastState, () => {
				canvas.renderAll();
				canvas.forEachObject((obj) => obj.setCoords());
			});
		}

		// Listener para salvar state em Undo
		const saveState = () => {
			const currentState = JSON.stringify(canvas.toJSON());
			if (
				undoStack.current.length === 0 ||
				undoStack.current[undoStack.current.length - 1] !== currentState
			) {
				undoStack.current.push(currentState);
				redoStack.current = [];
			}
		};
		canvas.on("object:modified", saveState);
		canvas.on("path:created", saveState);

		// Cleanup ao desmontar
		return () => {
			canvas.dispose();
		};
	}, [isImageUploaded]);

	/**
	 * useEffect para "escutar" mudanças no Brush (cor, largura).
	 */
	useEffect(() => {
		const canvas = fabricCanvasRef.current;
		if (!canvas) return;

		if (canvas.freeDrawingBrush) {
			canvas.freeDrawingBrush.color = brushColor;
			canvas.freeDrawingBrush.width = brushWidth;
		}
	}, [brushColor, brushWidth]);

	/**
	 * useEffect para controle de modo polígono:
	 * - se entrar em modo polígono, desativa isDrawingMode e anexa listener.
	 * - se sair do modo polígono, reativa brush e remove listener. Cancela polígonos inacabados.
	 */
	useEffect(() => {
		const canvas = fabricCanvasRef.current;
		if (!canvas) return;

		if (isPolygonMode) {
			// Desativar brush e remover listener do Eraser
			canvas.isDrawingMode = false;
			canvas.off("mouse:down", handleEraserClick);

			// Ativar listener para polígono
			canvas.on("mouse:down", handleCanvasClickForPolygon);
		} else {
			// Sair do modo polígono
			cancelPolygonDrawing();
			// Se não estiver em eraser, reativa ou não o brush
			if (!isEraserMode) {
				canvas.isDrawingMode = true;
			}
			canvas.off("mouse:down", handleCanvasClickForPolygon);
		}
	}, [isPolygonMode]);

	/**
	 * useEffect para controle do modo Eraser:
	 * - se entrar em modo eraser, remove brush e polígono, e anexa listener de clique que remove objeto.
	 * - se sair, remove o listener e volta ao estado anterior (brush ou polígono).
	 */
	useEffect(() => {
		const canvas = fabricCanvasRef.current;
		if (!canvas) return;

		if (isEraserMode) {
			const handleEraserClickLocal = (options: fabric.IEvent<MouseEvent>) => {
				if (!canvas) return;
				const target = options.target;
				if (target) {
					canvas.remove(target);
					canvas.discardActiveObject();
					canvas.requestRenderAll();
					saveStateManualmente();
				}
			};

			// Adiciona ao entrar no modo eraser
			canvas.on("mouse:down", handleEraserClickLocal);

			// Remove automaticamente ao sair do modo eraser
			return () => {
				canvas.off("mouse:down", handleEraserClickLocal);
			};
		}
	}, [isEraserMode]);

	/**
	 * Handler de clique no modo polígono
	 */
	const handleCanvasClickForPolygon = (options: fabric.IEvent<MouseEvent>) => {
		const canvas = fabricCanvasRef.current;
		if (!canvas) return;

		const pointer = canvas.getPointer(options.e);
		const zoom = canvas.getZoom();

		// Verifica se clicamos próximo do primeiro ponto para fechar o polígono
		if (pointArray.current.length > 0) {
			const firstCircle = pointArray.current[0];
			const dx = (firstCircle.left ?? 0) - pointer.x / zoom;
			const dy = (firstCircle.top ?? 0) - pointer.y / zoom;
			const distance = Math.sqrt(dx * dx + dy * dy);

			if (distance < 10) {
				finalizePolygon();
				return;
			}
		}

		// Cria um círculo (ponto)
		const circle = new fabric.Circle({
			radius: 5,
			fill: pointArray.current.length === 0 ? "red" : "#ffffff",
			stroke: "#333333",
			strokeWidth: 0.5,
			left: pointer.x / zoom,
			top: pointer.y / zoom,
			selectable: false,
			hasBorders: false,
			hasControls: false,
			originX: "center",
			originY: "center",
		});

		// Cria a linha que liga ao ponto anterior
		const line = new fabric.Line(
			[pointer.x / zoom, pointer.y / zoom, pointer.x / zoom, pointer.y / zoom],
			{
				strokeWidth: 2,
				stroke: "#999999",
				selectable: false,
				hasBorders: false,
				hasControls: false,
				evented: false,
			}
		);

		// Se já existe um polígono temporário
		if (activeShape.current) {
			const pos = canvas.getPointer(options.e);
			const polyPoints = activeShape.current.get("points") || [];
			polyPoints.push({ x: pos.x, y: pos.y });

			const newPolygon = new fabric.Polygon(polyPoints, {
				stroke: "#333",
				strokeWidth: 1,
				fill: "#cccccc",
				opacity: 0.2,
				selectable: false,
				hasBorders: false,
				hasControls: false,
				evented: false,
			});
			canvas.remove(activeShape.current);
			canvas.add(newPolygon);
			activeShape.current = newPolygon;
			canvas.renderAll();
		} else {
			// Cria o primeiro polígono “temporário”
			const polyPoint = [{ x: pointer.x, y: pointer.y }];
			const polygon = new fabric.Polygon(polyPoint, {
				stroke: "#333",
				strokeWidth: 1,
				fill: "#cccccc",
				opacity: 0.2,
				selectable: false,
				hasBorders: false,
				hasControls: false,
				evented: false,
			});
			activeShape.current = polygon;
			canvas.add(polygon);
		}

		activeLine.current = line;
		pointArray.current.push(circle);
		lineArray.current.push(line);

		canvas.add(line);
		canvas.add(circle);
		canvas.selection = false;
	};

	/**
	 * Finaliza o polígono
	 */
	const finalizePolygon = () => {
		const canvas = fabricCanvasRef.current;
		if (!canvas || !activeShape.current) return;

		const polyPoints = (activeShape.current.get("points") || []).map((p) => ({
			x: p.x,
			y: p.y,
		}));

		// Remove pontos e linhas temporárias
		pointArray.current.forEach((c) => canvas.remove(c));
		lineArray.current.forEach((l) => canvas.remove(l));
		if (activeLine.current) {
			canvas.remove(activeLine.current);
			activeLine.current = null;
		}
		canvas.remove(activeShape.current);

		// Cria o polígono final
		const polygon = new fabric.Polygon(polyPoints, {
			stroke: "#333333",
			strokeWidth: 1,
			fill: brushColor,
			opacity: 1,
			selectable: true,
			hasBorders: true,
			hasControls: true,
			evented: true,
		});
		canvas.add(polygon);

		// Limpa referências
		activeShape.current = null;
		pointArray.current = [];
		lineArray.current = [];

		canvas.selection = true;
		saveStateManualmente();
		message.success("Polígono finalizado!");
	};

	/**
	 * Cancela qualquer polígono em andamento
	 */
	const cancelPolygonDrawing = () => {
		const canvas = fabricCanvasRef.current;
		if (!canvas) return;

		pointArray.current.forEach((c) => canvas.remove(c));
		lineArray.current.forEach((l) => canvas.remove(l));
		if (activeLine.current) {
			canvas.remove(activeLine.current);
			activeLine.current = null;
		}
		if (activeShape.current) {
			canvas.remove(activeShape.current);
			activeShape.current = null;
		}
		pointArray.current = [];
		lineArray.current = [];
		canvas.renderAll();
	};

	/**
	 * Handler de clique no modo borracha:
	 * - Se clicar em um objeto, remove do canvas.
	 */
	const handleEraserClick = (options: fabric.IEvent<MouseEvent>) => {
		const canvas = fabricCanvasRef.current;
		if (!canvas) return;
		if (!isEraserMode) return;

		const target = options.target;
		if (target) {
			canvas.remove(target);
			canvas.discardActiveObject();
			canvas.requestRenderAll();
			saveStateManualmente();
		}
	};

	/**
	 * Salva estado manualmente no undoStack
	 */
	const saveStateManualmente = () => {
		const canvas = fabricCanvasRef.current;
		if (!canvas) return;

		const currentState = JSON.stringify(canvas.toJSON());
		if (
			undoStack.current.length === 0 ||
			undoStack.current[undoStack.current.length - 1] !== currentState
		) {
			undoStack.current.push(currentState);
			redoStack.current = [];
		}
	};

	// --------------- FUNÇÕES DE BOTÃO/TELA --------------

	const handleImageUpload = (file: File) => {
		const reader = new FileReader();
		reader.onload = (e) => {
			if (!e.target?.result) {
				console.error("Erro ao carregar a imagem.");
				message.error("Erro ao carregar a imagem.");
				return;
			}
			setBackgroundImage(e.target.result as string);
			setIsImageUploaded(true);
			message.success("Imagem de fundo definida com sucesso!");
		};
		reader.onerror = () => {
			console.error("Erro ao processar o arquivo.");
			message.error("Erro ao processar o arquivo.");
		};
		reader.readAsDataURL(file);
		return false;
	};

	/**
	 * Toggle para ligar/desligar modo brush
	 */
	const toggleBrushing = () => {
		const canvas = fabricCanvasRef.current;
		if (!canvas) return;

		// Se vamos ligar brush, desliga polígono/eraser
		if (!isBrushing) {
			setIsPolygonMode(false);
			setIsEraserMode(false);
			canvas.isDrawingMode = true;
		} else {
			canvas.isDrawingMode = false;
		}
		setIsBrushing(!isBrushing);
	};

	/**
	 * Toggle para ligar/desligar modo polígono
	 */
	const togglePolygonMode = () => {
		// Se vamos ativar polígono, desliga brush e eraser
		if (!isPolygonMode) {
			setIsBrushing(false);
			setIsEraserMode(false);
		}
		setIsPolygonMode(!isPolygonMode);
	};

	/**
	 * Toggle para ligar/desligar modo borracha
	 */
	const toggleEraserMode = () => {
		const canvas = fabricCanvasRef.current;
		if (!canvas) return;

		// Se estamos ativando eraser, desliga brush e polígono
		if (!isEraserMode) {
			setIsBrushing(false);
			setIsPolygonMode(false);
			canvas.isDrawingMode = false;
		}

		setIsEraserMode(!isEraserMode);
	};

	const undo = () => {
		if (fabricCanvasRef.current && undoStack.current.length > 1) {
			const lastState = undoStack.current.pop();
			if (lastState) {
				redoStack.current.push(lastState);
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
						{/* Configurações de Brush */}
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

						{/* Brush */}
						<button onClick={toggleBrushing}>
							{isBrushing ? "Disable Brush" : "Enable Brush"}
						</button>

						{/* Polygon */}
						<button onClick={togglePolygonMode}>
							{isPolygonMode ? "Disable Polygon" : "Enable Polygon"}
						</button>

						{/* Eraser */}
						<button onClick={toggleEraserMode}>
							{isEraserMode ? "Disable Eraser" : "Enable Eraser"}
						</button>

						{/* Undo */}
						<button onClick={undo}>Undo</button>
					</div>
				</>
			)}
		</div>
	);
};

export default CanvasArea;
