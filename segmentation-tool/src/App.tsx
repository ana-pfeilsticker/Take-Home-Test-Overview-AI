import { ConfigProvider, App as AntdApp } from "antd";
import Layout, { Content } from "antd/es/layout/layout";
import Sider from "antd/es/layout/Sider";
import theme from "./styles/theme";
import ClassesPanel from "./components/ClassesPanel/ClassesPanel";
import CanvasArea from "./components/Canvas/CanvasArea";
import ToolBar from "./components/Toolbar/Toobar";

function App() {
	return (
		<ConfigProvider
			theme={{
				token: {
					colorBgBase: theme.backgroundColor,
					fontFamily: "'Montserrat', sans-serif",
				},
			}}
		>
			<AntdApp>
				<Layout style={{ height: "100vh", background: "#FBFBFB" }}>
					<Sider
						width="25%"
						style={{
							background: theme.backgroundColor,
							padding: "20px",
						}}
					>
						<ClassesPanel />
					</Sider>
					<Content
						style={{
							padding: "20px",
							flexGrow: 1,
							gap: "25px",
							display: "flex",
						}}
					>
						<div
							style={{
								height: "100%",
								width: "100%",
								display: "flex",
								flexDirection: "column",
								gap: "25px",
							}}
						>
							<CanvasArea />
							<div
								style={{
									height: "40%",
									width: "100%",
									backgroundColor: theme.lightBackgroundColor,
									borderRadius: "20px",
									padding: "20px",
								}}
							>
								Preview
							</div>
						</div>

						<ToolBar />
					</Content>
				</Layout>
			</AntdApp>
		</ConfigProvider>
	);
}

export default App;
