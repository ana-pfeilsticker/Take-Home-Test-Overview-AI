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

	// Modo brush, polígono e borracha
	const [isBrushing, setIsBrushing] = useState(true);
	const [isPolygonMode, setIsPolygonMode] = useState(false);
	const [isEraserMode, setIsEraserMode] = useState(false);

	// Refs para o Polígono
	const pointArray = useRef<fabric.Circle[]>([]);
	const lineArray = useRef<fabric.Line[]>([]);
	const activeLine = useRef<fabric.Line | null>(null);
	const activeShape = useRef<fabric.Polygon | null>(null);

	//----------------------------------------------------------------
	// 1) Inicialização do Canvas (roda só quando a imagem é carregada)
	//----------------------------------------------------------------
	useEffect(() => {
		if (!canvasRef.current || !isImageUploaded) return;

		const canvasDiv = document.getElementById("canvas-div");
		if (!canvasDiv) {
			console.error("Elemento canvas-div não encontrado!");
			return;
		}

		const width = canvasDiv.clientWidth;
		const height = canvasDiv.clientHeight;

		const canvas = new fabric.Canvas(canvasRef.current, {
			isDrawingMode: true,
			selection: false,
			backgroundColor: "transparent",
			width,
			height,
		});
		fabricCanvasRef.current = canvas;

		// Configurar o brush
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

		// Salvar estado em Undo
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

		// Cleanup
		return () => {
			canvas.dispose();
		};
	}, [isImageUploaded]);

	//----------------------------------------------------------------
	// 2) Atualiza cor e largura do brush sempre que mudarem no state
	//----------------------------------------------------------------
	useEffect(() => {
		const canvas = fabricCanvasRef.current;
		if (!canvas) return;

		if (canvas.freeDrawingBrush) {
			canvas.freeDrawingBrush.color = brushColor;
			canvas.freeDrawingBrush.width = brushWidth;
		}
	}, [brushColor, brushWidth]);

	//----------------------------------------------------------------
	// 3) MODO POLÍGONO: define localmente a função e faz cleanup
	//----------------------------------------------------------------
	useEffect(() => {
		const canvas = fabricCanvasRef.current;
		if (!canvas) return;

		if (isPolygonMode) {
			// Desativa brush e Eraser
			canvas.isDrawingMode = false;
			// Se quiser remover qualquer listener local de eraser
			// mas aqui, se tiver, a gente pode remover

			// Limpamos polygon inacabado (se quiser) OU deixamos
			// Se você quiser sempre que ative polígono, comece limpo
			cancelPolygonDrawing();

			/**
			 * Função local para clique do polígono
			 */
			function handlePolygonLocal(options: fabric.IEvent<MouseEvent>) {
				if (!canvas) return;

				const pointer = canvas.getPointer(options.e);
				const zoom = canvas.getZoom();

				// Verifica se clicamos próximo do primeiro ponto
				if (pointArray.current.length > 0) {
					const firstCircle = pointArray.current[0];
					const dx = (firstCircle.left ?? 0) - pointer.x / zoom;
					const dy = (firstCircle.top ?? 0) - pointer.y / zoom;
					const distance = Math.sqrt(dx * dx + dy * dy);

					if (distance < 10) {
						finalizePolygonLocal();
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

				// Linha que liga ao ponto anterior
				const line = new fabric.Line(
					[
						pointer.x / zoom,
						pointer.y / zoom,
						pointer.x / zoom,
						pointer.y / zoom,
					],
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
					// Primeiro polígono “temporário”
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
			}

			/**
			 * Função local para finalizar o polígono
			 */
			function finalizePolygonLocal() {
				if (!activeShape.current) return;

				const polyPoints = (activeShape.current.get("points") || []).map(
					(p) => ({
						x: p.x,
						y: p.y,
					})
				);

				// Remove pontos e linhas temporárias
				pointArray.current.forEach((c) => canvas.remove(c));
				lineArray.current.forEach((l) => canvas.remove(l));
				if (activeLine.current) {
					canvas.remove(activeLine.current);
					activeLine.current = null;
				}
				canvas.remove(activeShape.current);

				// Cria polígono final
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

				activeShape.current = null;
				pointArray.current = [];
				lineArray.current = [];

				canvas.selection = true;
				saveStateManualmente();
				message.success("Polígono finalizado!");
			}

			// Anexa o listener local
			canvas.on("mouse:down", handlePolygonLocal);

			// Cleanup: remove listener e, se quiser, faz algo mais
			return () => {
				canvas.off("mouse:down", handlePolygonLocal);
				// Se desativar polígono, cancela shape inacabado
				cancelPolygonDrawing();
			};
		} else {
			// Se não estiver no modo polígono, pode reativar brush?
			if (!isEraserMode) {
				canvas.isDrawingMode = isBrushing;
			}
		}
	}, [isPolygonMode, isBrushing, isEraserMode, brushColor]);

	//----------------------------------------------------------------
	// 4) MODO BORRACHA: define localmente a função e faz cleanup
	//----------------------------------------------------------------
	useEffect(() => {
		const canvas = fabricCanvasRef.current;
		if (!canvas) return;

		if (isEraserMode) {
			// Desligar brush e polígono
			canvas.isDrawingMode = false;
			cancelPolygonDrawing();

			function handleEraserLocal(options: fabric.IEvent<MouseEvent>) {
				if (!canvas) return;
				const target = options.target;
				if (target) {
					canvas.remove(target);
					canvas.discardActiveObject();
					canvas.requestRenderAll();
					saveStateManualmente();
				}
			}

			canvas.on("mouse:down", handleEraserLocal);

			return () => {
				canvas.off("mouse:down", handleEraserLocal);
			};
		} else {
			// Se sair do modo borracha, volta ao brush/polygon?
			if (!isPolygonMode) {
				canvas.isDrawingMode = isBrushing;
			}
		}
	}, [isEraserMode, isPolygonMode, isBrushing]);

	//----------------------------------------------------------------
	// 5) Funções auxiliares
	//----------------------------------------------------------------

	/**
	 * Cancela qualquer polígono em andamento
	 */
	function cancelPolygonDrawing() {
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
	}

	/**
	 * Salva estado manualmente no undoStack
	 */
	function saveStateManualmente() {
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
	}

	/**
	 * Undo
	 */
	function undo() {
		const canvas = fabricCanvasRef.current;
		if (!canvas) return;

		if (undoStack.current.length > 1) {
			const lastState = undoStack.current.pop();
			if (lastState) {
				redoStack.current.push(lastState);
			}
			const previousState = undoStack.current[undoStack.current.length - 1];
			canvas.loadFromJSON(previousState).then(() => {
				canvas.renderAll();
			});
		} else {
			message.warning("Nada para desfazer.");
		}
	}

	//----------------------------------------------------------------
	// 6) Upload de Imagem
	//----------------------------------------------------------------
	function handleImageUpload(file: File) {
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
	}

	//----------------------------------------------------------------
	// 7) Botões: toggles para Brush, Polygon, Eraser
	//----------------------------------------------------------------
	function toggleBrushing() {
		const canvas = fabricCanvasRef.current;
		if (!canvas) return;

		if (isBrushing) {
			setIsBrushing(false);
			canvas.isDrawingMode = false;
		} else {
			setIsBrushing(true);
			setIsPolygonMode(false);
			setIsEraserMode(false);
			canvas.isDrawingMode = true;
		}
	}

	function togglePolygonMode() {
		const canvas = fabricCanvasRef.current;
		if (!canvas) return;

		if (isPolygonMode) {
			setIsPolygonMode(false);
		} else {
			setIsPolygonMode(true);
			setIsBrushing(false);
			setIsEraserMode(false);
			canvas.isDrawingMode = false;
		}
	}

	function toggleEraserMode() {
		const canvas = fabricCanvasRef.current;
		if (!canvas) return;

		if (isEraserMode) {
			setIsEraserMode(false);
		} else {
			setIsEraserMode(true);
			setIsBrushing(false);
			setIsPolygonMode(false);
			canvas.isDrawingMode = false;
		}
	}

	//----------------------------------------------------------------
	// 8) Render
	//----------------------------------------------------------------
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

						<button onClick={toggleBrushing}>
							{isBrushing ? "Disable Brush" : "Enable Brush"}
						</button>

						<button onClick={togglePolygonMode}>
							{isPolygonMode ? "Disable Polygon" : "Enable Polygon"}
						</button>

						<button onClick={toggleEraserMode}>
							{isEraserMode ? "Disable Eraser" : "Enable Eraser"}
						</button>

						<button onClick={undo}>Undo</button>
					</div>
				</>
			)}
		</div>
	);
};

export default CanvasArea;
