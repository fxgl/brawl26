import {useCallback, useEffect, useState} from 'react';
import {usePeer} from '../hooks/usePeer';
import {useUserProfileStore} from "../store/userProfileStore.ts";
import {useAppStore} from "../store/appStore.ts";
import {ConnectionStatusEnum, DataPacket, DataPacketChatMessage, MessageType} from "../../../../shared/datapacket.ts";
import {notifications} from '@mantine/notifications';
import {DataConnection} from "peerjs";
import {Loader, Modal, Stack, Text} from "@mantine/core";

// Define a type for received messages


export function PeerConnection() {
    //const [remotePeerId, setRemotePeerId] = useState('');
    const remotePeerId = useAppStore(state => state.remotePeerId);
    const setRemotePeerId = useAppStore.getState().setRemotePeerId;

    const profile = useUserProfileStore(state => state.profile);

    const onData = useCallback((peerId: string, data: DataPacket) => {
        if (data.type === MessageType.CHAT_MESSAGE && data.chatMessage) {
            const message: DataPacketChatMessage = data.chatMessage;
            message.fromPeerId = peerId;
            notifications.show({
                title: message.message,
                message: message.fromPeerId,
                color: 'green',
                autoClose: 5000,
            });
            //setReceivedMessages(prev => [...prev, message]);
        } else {
            console.log("Unhandled client data:", data);
            notifications.show({
                title: `${data.type} Unhandled`,
                message: JSON.stringify(data, null, 2),
                color: 'red',
                autoClose: 5000,
            });
        }
    }, []);

    const connectionStatus = useAppStore(state => state.connectionStatus);
    const setConnectionStatus = useAppStore.getState().setConnectionStatus;
    const setPeerList = useAppStore.getState().setPeerList;


    console.log("Rendering PeerConnection");
    const onConnection = useCallback(async (conn: DataConnection) => {
        notifications.show({
            title: `Connected to peed`,
            message: conn.peer,
            color: 'green',
            autoClose: 5000,
        });
    }, []);
    const onDisconnection = useCallback(async (peerId: string) => {
        notifications.show({
            title: `Disconnected from peed`,
            message: JSON.stringify(peerId, null, 2),
            color: 'red',
            autoClose: 5000,
        });
    }, []);


    const onServerData = useCallback((data: DataPacket) => {
        if (data.type === MessageType.MATCH_PROPOSED && data.matchProposed) {
            notifications.show({
                title: 'Match Proposed',
                message: `Connecting `,
                color: 'blue',
            });
            setRemotePeerId(data.matchProposed?.targetPeerId);
            //connect(data.matchProposed?.targetPeerId).catch(console.error);
        } else if (data.type === MessageType.CANCEL_MATCH_SEARCH && data.cancelMatchSearch) {
            notifications.show({
                title: 'Match Search Cancelled',
                message: 'Your match search has been cancelled',
                color: 'yellow',
            });

        } else if (data.type === MessageType.STATUS_UPDATE && data.statusUpdate) {
            setConnectionStatus(data.statusUpdate.statusTo);
        } else if (data.type === MessageType.PEER_LIST_UPDATE && data.peerListUpdate) {
            setPeerList(data.peerListUpdate.connectedPeers);
        } else {
            console.log("Unhandled server data:", data);
            notifications.show({
                title: `${data.type} Unhandled`,
                message: JSON.stringify(data, null, 2),
                color: 'red',
                autoClose: 5000,
            });
        }
    }, [setConnectionStatus, setPeerList]);

    const onError = useCallback(() => {
        setConnectionStatus(ConnectionStatusEnum.error);
    },[setConnectionStatus]);
    //
    // const connectedToRemotePeer = useCallback(async ()=>{
    //     notifications.show({
    //         title: `connectedToRemotePeer`,
    //         message: '' ,
    //         color: 'red',
    //         autoClose: 5000,
    //     });
    // },[]);

    const {
        // myPeerId,
        connectedPeers,
        // isConnecting,
        // error,
        initialize,
        connect,
        // send,
        //sendServer,
        // broadcast
    } = usePeer({
        test: 'peerjs',
        onData: onData,
        onServerData: onServerData,
        onConnection: onConnection,
        onDisconnection: onDisconnection,
        onError: onError
    });


    const [error, setError] = useState<string>('');


    useEffect(() => {
        if (profile && connectionStatus === ConnectionStatusEnum.idle) {
            console.log("Initializing peer with profile id:", profile.id);
            setError('');
            initialize(profile.id).catch((error) => {
                setConnectionStatus(ConnectionStatusEnum.error);
                console.error("Failed to initialize peer:", error.type);
                if (error.type === 'unavailable-id') {
                    setError('You are already connected. Please close other copy');
                } else
                if (error.type === 'network') {
                    setError('Server down. Please wait a moment');
                } else
                {
                    setError(error.type);
                }
            })//.then(()=>setYouAreAlreadyConnected(false));
        }
    }, [profile, initialize, connectionStatus, setConnectionStatus]);

    useEffect(() => {
        if (connectionStatus == ConnectionStatusEnum.error) {
            // set status idle in 5 seconds
            const timer = setTimeout(() => {
                setConnectionStatus(ConnectionStatusEnum.idle);
            }, 5000);

            return () => clearTimeout(timer);
        }
    }, [connectionStatus, setConnectionStatus]);

    useEffect(() => {
        if (connectedPeers.length > 0) {
            notifications.show({
                title: `connectedToRemotePeer`,
                message: connectedPeers,
                color: 'red',
                autoClose: 5000,
            });
            useAppStore.getState().matchAccepted(connectedPeers[0]);
            setRemotePeerId(connectedPeers[0]);
        }
    }, [connectedPeers]);
    useEffect(() => {
        void connect(remotePeerId);
    }, [connect, remotePeerId]);


    return (
        <Modal opened={[ConnectionStatusEnum.idle, ConnectionStatusEnum.error].includes(connectionStatus)} centered
               onClose={() => setConnectionStatus(ConnectionStatusEnum.idle)}>

            <Stack align={'center'}>
                {connectionStatus === ConnectionStatusEnum.error ?
                    <Text> {error} </Text> :
                    <Text> Connecting </Text>}
                <Loader></Loader>
            </Stack>

        </Modal>
    );
}
