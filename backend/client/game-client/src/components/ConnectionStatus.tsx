import {Badge, Box, Group} from '@mantine/core';
import { useAppStore} from "../store/appStore.ts";
import {ConnectionStatusEnum} from "../../../../shared/datapacket.ts";
import { IconUsers } from '@tabler/icons-react';

export function ConnectionStatus() {

  const connectionStatus = useAppStore(state => state.connectionStatus)
  const peerList = useAppStore(state => state.peerList)



  const peerConnectOpened = useAppStore(state => state.peerConnectOpened);
  const setPeerConnectOpened = useAppStore.getState().setPeerConnectOpened;

  const getColorByState = (): string => {
    switch (connectionStatus) {
      case ConnectionStatusEnum.idle:
        return 'gray';
      case ConnectionStatusEnum.connecting:
        return 'yellow';
      case ConnectionStatusEnum.connected:
        return 'green';
      case ConnectionStatusEnum.match:
        return 'red';
      case ConnectionStatusEnum.lookingForMatch:
        return 'blue';
      default:
        return 'gray';
    }
  };

  return (
    <Box
      style={{
        position: 'fixed',
        bottom: '20px',
        right: '20px',
        zIndex: 1000,
      }}
    >
      <Group >
        <Badge color="teal" size="md" variant="filled" leftSection={<IconUsers size={14} />}>
          {peerList.length}
        </Badge>
        <Badge onClick={()=>{setPeerConnectOpened(!peerConnectOpened)}} color={getColorByState()} size="lg" variant="filled">
          {ConnectionStatusEnum[connectionStatus]}
        </Badge>
      </Group>
    </Box>
  );
}
