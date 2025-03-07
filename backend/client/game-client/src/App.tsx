import './App.css'
// Import styles of packages that you've installed.
// All packages except `@mantine/hooks` require styles imports
import '@mantine/core/styles.css';

import {MantineProvider} from '@mantine/core';
import {Lobby} from "./component/Lobby.tsx";
import {MantineEmotionProvider} from "@mantine/emotion";
import {PeerConnection} from "./components/PeerConnection.tsx";


export default function App() {
    return <MantineEmotionProvider>
        <MantineProvider>
            <PeerConnection></PeerConnection>
            {/*<Lobby></Lobby>*/}
        </MantineProvider>
    </MantineEmotionProvider>;
}

