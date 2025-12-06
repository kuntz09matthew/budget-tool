"""
Changelog Manager - SQLite Database for Version History
Stores all version changes and their descriptions
"""
import sqlite3
import json
from datetime import datetime
from pathlib import Path

class ChangelogManager:
    def __init__(self, db_path=None):
        # Use absolute path relative to this file's location
        if db_path is None:
            db_path = Path(__file__).parent / 'changelog.db'
        self.db_path = str(db_path)
        self.init_database()
    
    def init_database(self):
        """Initialize the changelog database"""
        # Ensure the directory exists
        db_dir = Path(self.db_path).parent
        db_dir.mkdir(parents=True, exist_ok=True)
        
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS versions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                version TEXT NOT NULL UNIQUE,
                version_type TEXT NOT NULL,
                release_date DATETIME DEFAULT CURRENT_TIMESTAMP,
                is_released BOOLEAN DEFAULT 0,
                summary TEXT
            )
        ''')
        
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS changes (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                version_id INTEGER NOT NULL,
                change_type TEXT NOT NULL,
                description TEXT NOT NULL,
                file_path TEXT,
                commit_hash TEXT,
                FOREIGN KEY (version_id) REFERENCES versions (id)
            )
        ''')
        
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS release_notes (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                version_id INTEGER NOT NULL UNIQUE,
                notes TEXT,
                created_date DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (version_id) REFERENCES versions (id)
            )
        ''')
        
        conn.commit()
        conn.close()
    
    def add_version(self, version, version_type, summary='', is_released=False):
        """Add a new version entry"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        try:
            cursor.execute('''
                INSERT INTO versions (version, version_type, summary, is_released)
                VALUES (?, ?, ?, ?)
            ''', (version, version_type, summary, is_released))
            
            version_id = cursor.lastrowid
            conn.commit()
            return version_id
        except sqlite3.IntegrityError:
            # Version already exists, return existing id
            cursor.execute('SELECT id FROM versions WHERE version = ?', (version,))
            return cursor.fetchone()[0]
        finally:
            conn.close()
    
    def add_change(self, version_id, change_type, description, file_path='', commit_hash=''):
        """Add a change entry for a version"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        cursor.execute('''
            INSERT INTO changes (version_id, change_type, description, file_path, commit_hash)
            VALUES (?, ?, ?, ?, ?)
        ''', (version_id, change_type, description, file_path, commit_hash))
        
        conn.commit()
        conn.close()
    
    def mark_version_released(self, version):
        """Mark a version as released"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        cursor.execute('''
            UPDATE versions SET is_released = 1 WHERE version = ?
        ''', (version,))
        
        conn.commit()
        conn.close()
    
    def get_all_versions(self):
        """Get all versions with their changes"""
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        
        cursor.execute('''
            SELECT * FROM versions ORDER BY release_date DESC
        ''')
        
        versions = []
        for row in cursor.fetchall():
            version_data = dict(row)
            
            # Get changes for this version
            cursor.execute('''
                SELECT * FROM changes WHERE version_id = ? ORDER BY id
            ''', (version_data['id'],))
            
            version_data['changes'] = [dict(change) for change in cursor.fetchall()]
            versions.append(version_data)
        
        conn.close()
        return versions
    
    def get_version(self, version):
        """Get a specific version with its changes"""
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        
        cursor.execute('SELECT * FROM versions WHERE version = ?', (version,))
        row = cursor.fetchone()
        
        if not row:
            conn.close()
            return None
        
        version_data = dict(row)
        
        # Get changes
        cursor.execute('''
            SELECT * FROM changes WHERE version_id = ? ORDER BY id
        ''', (version_data['id'],))
        
        version_data['changes'] = [dict(change) for change in cursor.fetchall()]
        
        conn.close()
        return version_data
    
    def get_latest_version(self):
        """Get the most recent version"""
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        
        cursor.execute('''
            SELECT * FROM versions ORDER BY release_date DESC LIMIT 1
        ''')
        
        row = cursor.fetchone()
        conn.close()
        
        return dict(row) if row else None
    
    def export_changelog_markdown(self):
        """Export changelog as markdown"""
        versions = self.get_all_versions()
        
        markdown = "# Changelog\n\nAll notable changes to Budget Tool.\n\n"
        
        for version in versions:
            released = "Released" if version['is_released'] else "Unreleased"
            markdown += f"\n## [{version['version']}] - {released}\n"
            markdown += f"*{version['release_date']}*\n\n"
            
            if version['summary']:
                markdown += f"{version['summary']}\n\n"
            
            # Group changes by type
            changes_by_type = {}
            for change in version['changes']:
                change_type = change['change_type']
                if change_type not in changes_by_type:
                    changes_by_type[change_type] = []
                changes_by_type[change_type].append(change['description'])
            
            type_names = {
                'feature': '### ✨ New Features',
                'fix': '### 🐛 Bug Fixes',
                'improvement': '### 🚀 Improvements',
                'breaking': '### 💥 Breaking Changes',
                'other': '### 📝 Other Changes'
            }
            
            for change_type, changes in changes_by_type.items():
                markdown += f"{type_names.get(change_type, '### 📝 Changes')}\n"
                for change in changes:
                    markdown += f"- {change}\n"
                markdown += "\n"
        
        return markdown

if __name__ == '__main__':
    # Test the changelog manager
    manager = ChangelogManager()
    print("Changelog database initialized!")
