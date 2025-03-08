import {useState} from 'react';
import {Box, Button, Container, Divider, Group, Loader, Paper, Stack, Text, TextInput, Title} from '@mantine/core';
import {createStyles,} from '@mantine/emotion';
import { useAppStore} from "../store/appStore.ts";
import {ConnectionStatusEnum} from "../../../../shared/datapacket.ts";


// Create styles for the background image
// Create styles for the background image
const useStyles = createStyles(() => ({
    backgroundContainer: {
        backgroundImage: 'url("/tankbros.jpeg")',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        minHeight: '100vh',
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '0',
        margin: '0',
        position: 'absolute',
        top: '0',
        left: '0',
        right: '0',
        bottom: '0',
        overflow: 'auto'
    }
}));

export function Lobby() {
    const {classes} = useStyles();
    const [matchCode, setMatchCode] = useState('');

    const handleQuickPlay = () => {
        lookForServer();
    };

    const  handleStopLookForServer = () => {
        stopLookForServer();
    };


    const handleJoinMatch = () => {
        // TODO: Implement join match with code functionality
        console.log('Joining match with code:', matchCode);
    };
    const lookForServer = useAppStore.getState().lookForServer;
    const stopLookForServer = useAppStore.getState().stopLookForServer;
    const connectionStatus = useAppStore(state => state.connectionStatus);

    return (
        <div className={classes.backgroundContainer}>
            <Container size="sm" py="xl">
                <Paper shadow="md" p="xl" radius="md">
                    <Stack>
                        <Title order={1} mb="md">TANK BROS</Title>

                        <Box>
                            <Text size="lg" w={500} mb="xs">Quick Play</Text>
                            <Text color="dimmed" size="sm" mb="md">
                                Join a random match with other players
                            </Text>
                            {connectionStatus !== ConnectionStatusEnum.lookingForMatch ? <Button
                                    fullWidth
                                    size="lg"
                                    color="green"
                                    onClick={handleQuickPlay}
                                    disabled={connectionStatus !== ConnectionStatusEnum.connected}
                                >
                                    Quick Play
                                </Button> :
                                <Button
                                    fullWidth
                                    size="lg"
                                    color="red"
                                    onClick={handleStopLookForServer}
                                    leftSection={<Loader type={'dots'} />}
                                >
                                    Looking for match...
                                </Button>}
                        </Box>

                        <Divider label="OR" labelPosition="center"/>

                        <Box>
                            <Text size="lg" mb="xs">Join with Code</Text>
                            <Text c="dimmed" size="sm" mb="md">
                                Enter a match code to join a specific game
                            </Text>
                            <Group grow>
                                <TextInput
                                    placeholder="Enter match code"
                                    value={matchCode}
                                    onChange={(event) => setMatchCode(event.currentTarget.value)}
                                    size="md"
                                />
                                <Button
                                    color="blue"
                                    onClick={handleJoinMatch}
                                    disabled={!matchCode.trim()}
                                    size="md"
                                >
                                    Join Match
                                </Button>
                            </Group>
                        </Box>
                    </Stack>
                </Paper>
            </Container>
        </div>
    );
}
