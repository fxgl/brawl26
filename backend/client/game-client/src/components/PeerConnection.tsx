import {useCallback, useEffect, useState} from 'react';
import {usePeer} from '../hooks/usePeer';
import {useUserProfileStore} from "../store/userProfileStore.ts";
import {useAppStore} from "../store/appStore.ts";
import {ConnectionStatusEnum, DataPacket, DataPacketChatMessage, MessageType} from "../../../../shared/datapacket.ts";
import {notifications} from '@mantine/notifications';
import {DataConnection} from "peerjs";
import {Loader, Modal, Stack, Text} from "@mantine/core";
import {peerService} from "../utils/peerService.ts";
// Define a type for received messages


export function PeerConnection() {

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
    const setRemotePeerIds = useAppStore.getState().setRemotePeerIds;
    const setPeerList = useAppStore.getState().setPeerList;


    console.log(`Rendering PeerConnection ${connectionStatus}`);
    const onConnection = useCallback(async (conn: DataConnection) => {
        notifications.show({
            title: `Connected to peed`,
            message: conn.peer,
            color: 'green',
            autoClose: 5000,
        });
        setRemotePeerIds(peerService.getConnectedPeers());
    }, [setRemotePeerIds]);

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

           // connect(data.matchProposed?.targetPeerIds).catch(console.error);
        }

       else if (data.type === MessageType.MATCH_OPPORTUNITY && data.matchOpportunity) {
            notifications.show({
                title: 'MATCH_OPPORTUNITY',
                message: `Connecting `,
                color: 'blue',
            });
            //setRemotePeerIds(data.matchProposed?.targetPeerIds);

            useAppStore.getState().acceptMatch(data.matchOpportunity.proposalId);
            //connect(data.matchProposed?.targetPeerId).catch(console.error);
        }
        //
        // Received message from server: {"type":"matchCreated","matchCreated":{"matchId":"match_1741548741851_89e66a5e-445b-4d88-9939-f896e7b3d70d_f8edb500-7339-4579-a600-94da8ff6053a","peerIds":["89e66a5e-445b-4d88-9939-f896e7b3d70d","f8edb500-7339-4579-a600-94da8ff6053a"],"isHost":false}}
        //
        else if (data.type === MessageType.MATCH_CREATED && data.matchCreated) {
            useAppStore.getState().setCurrentMatch(data?.matchCreated);
        }
        //PEER_ACCEPTED_MATCH Unhandled
        // { "type": "PEER_ACCEPTED_MATCH", "peerAcceptedMatch": { "proposalId": "proposal_1741550010345_89e66a5e-445b-4d88-9939-f896e7b3d70d_f8edb500-7339-4579-a600-94da8ff6053a", "peerId": "f8edb500-7339-4579-a600-94da8ff6053a", "acceptedCount": 2, "totalCount": 2 } }
        else if (data.type === MessageType.PEER_ACCEPTED_MATCH && data.peerAcceptedMatch) {

            notifications.show({
                title: 'PEER_ACCEPTED_MATCH',
                message: data.peerAcceptedMatch?.hostPeerId,
                color: 'blue',
            });
            if(data.peerAcceptedMatch?.hostPeerId !== profile?.id)
            {
                connect(data.peerAcceptedMatch?.hostPeerId).catch(console.error);
            }

        }

        else if (data.type === MessageType.CANCEL_MATCH_SEARCH && data.cancelMatchSearch) {
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
            console.error("Initializing peer with profile id:", profile.id);
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
            setConnectionStatus(ConnectionStatusEnum.connecting);
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
            console.log("Connected to remote peers:", connectedPeers);
         //  useAppStore.getState().matchAccepted(connectedPeers);
          //  setRemotePeerIds(connectedPeers);
        }
    }, [connectedPeers]);
    // useEffect(() => {
    //     void connect(remotePeerIds[0]);
    // }, [connect, remotePeerIds]);


    return (
        <Modal opened={[ConnectionStatusEnum.idle, ConnectionStatusEnum.error, ConnectionStatusEnum.connecting].includes(connectionStatus)} centered
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
