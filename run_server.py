#!/usr/bin/env python3
"""
Simple launcher script - just runs the Flask server
Use this for development/testing without GUI
"""
from server.app import app

if __name__ == '__main__':
    print("=" * 50)
    print("Budget Tool - Development Server")
    print("=" * 50)
    print("Server starting at: http://localhost:5000")
    print("Press Ctrl+C to stop")
    print("=" * 50)
    
    app.run(host='127.0.0.1', port=5000, debug=True)
