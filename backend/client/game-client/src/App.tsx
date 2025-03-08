import './App.css'
// Import styles of packages that you've installed.
// All packages except `@mantine/hooks` require styles imports
import '@mantine/core/styles.css';

import {MantineProvider} from '@mantine/core';
import {Lobby} from "./component/Lobby.tsx";
import {MantineEmotionProvider} from "@mantine/emotion";
import {PeerConnection} from "./components/PeerConnection.tsx";
import {ConnectionStatus} from "./components/ConnectionStatus.tsx";
import {Notifications} from "@mantine/notifications";
import {useAppStore} from "./store/appStore.ts";
import {ConnectionStatusEnum} from "../../../shared/datapacket.ts";
import {PongGame} from "./components/PongGame.tsx";



export default function App() {
    const connectionStatus = useAppStore(state => state.connectionStatus);
    return <MantineEmotionProvider>

        <MantineProvider>
            <Notifications/>

            {connectionStatus=== ConnectionStatusEnum.match ? <PongGame /> :  <Lobby></Lobby>}
            <PeerConnection></PeerConnection>
            <ConnectionStatus/>

        </MantineProvider>

    </MantineEmotionProvider>;
}

