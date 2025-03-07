using System.Collections;
using UnityEngine;

public class PeerJSTest : MonoBehaviour
{
    [Header("Peer Configuration")]
    [SerializeField] private string apiKey = "peerjs"; // Default PeerJS API key
    [SerializeField] private string peerId = ""; // Leave empty for random ID
    [SerializeField] private string host = "0.peerjs.com";
    [SerializeField] private int port = 443;
    
    [Header("Connection")]
    [SerializeField] private string remotePeerId = ""; // ID of peer to connect to
    [SerializeField] private bool autoConnect = false;
    [SerializeField] private string messageToSend = "Hello from Unity!";
    
    private UnityPeerJS.Peer _peer;
    private UnityPeerJS.Peer.IConnection _activeConnection;
    private bool _isConnected = false;
    private bool _isPeerInitialized = false;

    void Start()
    {
        InitializePeer();
    }

    void Update()
    {
        if (_peer != null)
        {
            _peer.Pump();
            
            // Auto-connect to remote peer if specified
            if (autoConnect && _isPeerInitialized && !_isConnected && !string.IsNullOrEmpty(remotePeerId))
            {
                ConnectToRemotePeer(remotePeerId);
                autoConnect = false; // Only try once
            }
        }
    }

    void OnDestroy()
    {
        if (_peer != null)
        {
            Debug.Log("Destroying peer connection");
            _peer.Destroy();
            _peer = null;
        }
    }

    private void InitializePeer()
    {
        try
        {
            Debug.Log("Initializing PeerJS connection...");
            _peer = new UnityPeerJS.Peer(apiKey, peerId, host, port);
            
            _peer.OnOpen += OnPeerOpen;
            _peer.OnConnection += OnPeerConnection;
            _peer.OnDisconnected += OnPeerDisconnected;
            _peer.OnClose += OnPeerClose;
            _peer.OnError += OnPeerError;
            
            Debug.Log("PeerJS initialization started");
        }
        catch (System.Exception e)
        {
            Debug.LogError($"Failed to initialize PeerJS: {e.Message}");
        }
    }

    private void OnPeerOpen()
    {
        _isPeerInitialized = true;
        Debug.Log("Peer connection opened successfully!");
    }

    private void OnPeerConnection(UnityPeerJS.Peer.IConnection connection)
    {
        Debug.Log($"Received connection from peer: {connection.RemoteId}");
        
        _activeConnection = connection;
        _isConnected = true;
        
        // Set up event handlers for this connection
        connection.OnData += OnConnectionData;
        connection.OnClose += OnConnectionClose;
        
        // Send a welcome message
        StartCoroutine(SendDelayedMessage(connection, messageToSend, 1.0f));
    }

    private void OnPeerDisconnected()
    {
        Debug.Log("Peer disconnected from server");
        _isPeerInitialized = false;
    }

    private void OnPeerClose()
    {
        Debug.Log("Peer connection closed");
        _isPeerInitialized = false;
    }

    private void OnPeerError(string error)
    {
        Debug.LogError($"Peer error: {error}");
    }

    private void OnConnectionData(string data)
    {
        Debug.Log($"Received data: {data}");
    }

    private void OnConnectionClose()
    {
        Debug.Log("Connection closed");
        _isConnected = false;
        _activeConnection = null;
    }

    public void ConnectToRemotePeer(string remoteId)
    {
        if (_peer != null && _isPeerInitialized)
        {
            Debug.Log($"Connecting to peer: {remoteId}");
            _peer.Connect(remoteId);
        }
        else
        {
            Debug.LogWarning("Cannot connect: Peer not initialized");
        }
    }

    public void SendMessage(string message)
    {
        if (_activeConnection != null && _isConnected)
        {
            Debug.Log($"Sending message: {message}");
            _activeConnection.Send(message);
        }
        else
        {
            Debug.LogWarning("Cannot send message: No active connection");
        }
    }

    private IEnumerator SendDelayedMessage(UnityPeerJS.Peer.IConnection connection, string message, float delay)
    {
        yield return new WaitForSeconds(delay);
        
        if (connection != null)
        {
            Debug.Log($"Sending welcome message: {message}");
            connection.Send(message);
        }
    }

    // Public methods for UI buttons
    public void ConnectButtonPressed()
    {
        ConnectToRemotePeer(remotePeerId);
    }

    public void SendMessageButtonPressed()
    {
        SendMessage(messageToSend);
    }

    public void DisconnectButtonPressed()
    {
        if (_peer != null)
        {
            _peer.Disconnect();
        }
    }
}