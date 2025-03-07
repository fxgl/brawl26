import { useState } from 'react';
import {
    Container,
    Title,
    Button,
    TextInput,
    Group,
    Paper,
    Stack,
    Text,
    Divider,
    Box
} from '@mantine/core';
import { createStyles, } from '@mantine/emotion';

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
    const { classes } = useStyles();
    const [matchCode, setMatchCode] = useState('');

    const handleQuickPlay = () => {
        // TODO: Implement quick play functionality
        console.log('Quick play clicked');
    };

    const handleJoinMatch = () => {
        // TODO: Implement join match with code functionality
        console.log('Joining match with code:', matchCode);
    };

    return (
        <div className={classes.backgroundContainer}>
            <Container size="sm" py="xl">
                <Paper shadow="md" p="xl" radius="md">
                    <Stack >
                        <Title order={1} mb="md">TANK BROS</Title>

                        <Box>
                            <Text size="lg" w={500} mb="xs">Quick Play</Text>
                            <Text color="dimmed" size="sm" mb="md">
                                Join a random match with other players
                            </Text>
                            <Button
                                fullWidth
                                size="lg"
                                color="green"
                                onClick={handleQuickPlay}
                            >
                                Quick Play
                            </Button>
                        </Box>

                        <Divider label="OR" labelPosition="center" />

                        <Box>
                            <Text size="lg" w={500} mb="xs">Join with Code</Text>
                            <Text color="dimmed" size="sm" mb="md">
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
