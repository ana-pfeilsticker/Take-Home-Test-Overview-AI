import { ConfigProvider, App as AntdApp } from "antd";
import Layout, { Content } from "antd/es/layout/layout";
import Sider from "antd/es/layout/Sider";
import theme from "./styles/theme";
import ClassesPanel from "./components/ClassesPanel/ClassesPanel";
import CanvasArea from "./components/Canvas/CanvasArea";

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
							flexDirection: "column",
						}}
					>
						<CanvasArea />
						<div
							style={{
								height: "40%",
								width: "90%",
								backgroundColor: theme.lightBackgroundColor,
								borderRadius: "20px",
								padding: "20px",
							}}
						>
							Preview
						</div>
					</Content>
				</Layout>
			</AntdApp>
		</ConfigProvider>
	);
}

export default App;
