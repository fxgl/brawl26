import {useState, useEffect, useCallback} from 'react';
import { usePeer } from '../hooks/usePeer';
import { Button, TextInput, Group, Stack, Text, Paper, Badge } from '@mantine/core';
import { DataPacket } from "../utils/peerService.ts";
import { useUserProfileStore } from "../store/userProfileStore.ts";

// Define a type for the message data
type MessageData = string | Record<string, unknown>;

// Define a type for received messages
interface ReceivedMessage {
    from: string;
    message: MessageData;
}

export function PeerConnection() {
    const [remotePeerId, setRemotePeerId] = useState('');
    const [message, setMessage] = useState<DataPacket>({
        type: 'chat',
        payload: '',
        timestamp: Date.now(),
        senderId: ''
    });
    const [receivedMessages, setReceivedMessages] = useState<ReceivedMessage[]>([]);

    const profile = useUserProfileStore(state => state.profile);

    const onIncomingData = useCallback ((peerId: string, data: DataPacket) => {
        console.log(peerId,data);
        setReceivedMessages(prev => [...prev, {from: peerId, message: data.payload}]);
    },[]);

    console.log("Rendering PeerConnection");

    const {
        myPeerId,
        connectedPeers,
        isConnecting,
        error,
        initialize,
        connect,
        send,
        broadcast
    } = usePeer({test: 'peerjs',onData:onIncomingData});

    // Update senderId when profile or myPeerId changes
    useEffect(() => {
        if (profile) {
            setMessage(prev => ({
                ...prev,
                senderId: profile.id
            }));
        }
    }, [profile]);

    const handleInitialize = () => {
        if (profile != null) {
            initialize(profile.id).catch(console.error);
        }
    };

    const handleConnect = () => {
        if (remotePeerId) {
            connect(remotePeerId).catch(console.error);
        }
    };

    const handleSend = (peerId: string) => {
        if (message && message.payload) {
            // Update timestamp before sending
            const messageToSend = {
                ...message,
                timestamp: Date.now()
            };
            send(peerId, messageToSend);
            // Reset only the payload after sending
            setMessage(prev => ({
                ...prev,
                payload: ''
            }));
        }
    };

    const handleBroadcast = () => {
        if (message && message.payload) {
            // Update timestamp before broadcasting
            const messageToSend = {
                ...message,
                timestamp: Date.now()
            };
            broadcast(messageToSend);
            // Reset only the payload after sending
            setMessage(prev => ({
                ...prev,
                payload: ''
            }));
        }
    };

    const handleMessageChange = (value: string) => {
        console.log(value);
        setMessage(prev => ({
            ...prev,
            payload: value
        }));
    };

    return (
        <Stack gap="md" p="md">
            <Paper withBorder p="md">
                <Stack gap="sm">
                    <Group justify="space-between">
                        <Text fw={500}>Your Peer ID:</Text>
                        {myPeerId ? (
                            <Badge size="lg">{myPeerId}</Badge>
                        ) : (
                            <Button
                                onClick={handleInitialize}
                                loading={isConnecting}
                                disabled={!!myPeerId}
                            >
                                Initialize Peer
                            </Button>
                        )}
                    </Group>

                    {error && (
                        <Text c="red">{error.message}</Text>
                    )}
                </Stack>
            </Paper>
            <Paper withBorder p="md">
                {profile?.id}
            </Paper>
            <Paper withBorder p="md">
                <Stack gap="sm">
                    <Text fw={500}>Connect to a Peer:</Text>
                    <Group>
                        <TextInput
                            placeholder="Enter remote peer ID"
                            value={remotePeerId}
                            onChange={(e) => setRemotePeerId(e.currentTarget.value)}
                            style={{ flex: 1 }}
                        />
                        <Button
                            onClick={handleConnect}
                            loading={isConnecting}
                            disabled={!myPeerId || !remotePeerId}
                        >
                            Connect
                        </Button>
                    </Group>
                </Stack>
            </Paper>

            {connectedPeers.length > 0 && (
                <Paper withBorder p="md">
                    <Stack gap="sm">
                        <Text fw={500}>Connected Peers:</Text>
                        {connectedPeers.map(peerId => (
                            <Group key={peerId} justify="space-between">
                                <Badge>{peerId}</Badge>
                                <Group>
                                    <Button
                                        size="xs"
                                        onClick={() => handleSend(peerId)}
                                        disabled={!message.payload}
                                    >
                                        Send Message
                                    </Button>
                                </Group>
                            </Group>
                        ))}

                        <TextInput
                            placeholder="Type a message"
                            value={message.payload}
                            onChange={(e) => handleMessageChange(e.currentTarget.value)}
                        />

                        <Button
                            onClick={handleBroadcast}
                            disabled={!message.payload || connectedPeers.length === 0}
                        >
                            Broadcast to All
                        </Button>
                    </Stack>
                </Paper>
            )}

            {receivedMessages.length > 0 && (
                <Paper withBorder p="md">
                    <Stack gap="sm">
                        <Text fw={500}>Received Messages:</Text>
                        {receivedMessages.map((msg, index) => (
                            <Group key={index}>
                                <Badge>{msg.from}:</Badge>
                                <Text>{JSON.stringify(msg.message)}</Text>
                            </Group>
                        ))}
                    </Stack>
                </Paper>
            )}
        </Stack>
    );
}
