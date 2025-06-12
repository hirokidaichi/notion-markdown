"""
Python Examples for Notion Markdown API

This module demonstrates how to interact with the Notion Markdown API using Python.
Requires: requests library (pip install requests)

Usage:
    python python-examples.py
"""

import json
import os
import re
import time
from datetime import datetime
from typing import Dict, List, Optional, Any, Union
from dataclasses import dataclass
from urllib.parse import urljoin
import requests


@dataclass
class NotionMarkdownConfig:
    """Configuration for the Notion Markdown API client"""
    base_url: str
    api_key: str
    timeout: int = 30
    max_retries: int = 3


@dataclass
class GetPageResponse:
    """Response from getting a page"""
    markdown: str
    title: str


@dataclass
class AppendPageRequest:
    """Request for appending content to a page"""
    markdown: str


@dataclass
class AppendPageResponse:
    """Response from appending content to a page"""
    success: bool


class NotionMarkdownApiError(Exception):
    """Custom exception for API errors"""
    
    def __init__(self, message: str, status_code: int, details: Optional[str] = None):
        super().__init__(message)
        self.status_code = status_code
        self.details = details


class NotionMarkdownClient:
    """
    Python client for the Notion Markdown API
    
    Example:
        client = NotionMarkdownClient(NotionMarkdownConfig(
            base_url="http://localhost:8000",
            api_key="your-api-key"
        ))
        
        page = client.get_page("12345678-1234-1234-1234-123456789abc")
        print(f"Page title: {page.title}")
    """
    
    def __init__(self, config: NotionMarkdownConfig):
        self.base_url = config.base_url.rstrip('/')
        self.api_key = config.api_key
        self.timeout = config.timeout
        self.max_retries = config.max_retries
        
        # Create a session for connection pooling
        self.session = requests.Session()
        self.session.headers.update({
            'Content-Type': 'application/json',
            'User-Agent': 'NotionMarkdown-Python-Client/1.0'
        })
    
    def _make_request(
        self, 
        method: str, 
        path: str, 
        data: Optional[Dict[str, Any]] = None,
        require_auth: bool = True
    ) -> Dict[str, Any]:
        """Make an HTTP request to the API"""
        url = urljoin(self.base_url + '/', path.lstrip('/'))
        
        headers = {}
        if require_auth and path.startswith('api/pages/'):
            headers['Authorization'] = f'Bearer {self.api_key}'
        
        kwargs = {
            'timeout': self.timeout,
            'headers': headers
        }
        
        if data is not None:
            kwargs['json'] = data
        
        for attempt in range(self.max_retries + 1):
            try:
                response = self.session.request(method, url, **kwargs)
                
                # Parse JSON response
                try:
                    response_data = response.json()
                except json.JSONDecodeError:
                    response_data = {'error': 'Invalid JSON response'}
                
                # Handle error responses
                if not response.ok:
                    error_msg = response_data.get('error', f'HTTP {response.status_code}')
                    details = response_data.get('details')
                    raise NotionMarkdownApiError(error_msg, response.status_code, details)
                
                return response_data
                
            except requests.exceptions.RequestException as e:
                if attempt == self.max_retries:
                    raise NotionMarkdownApiError(f"Network error: {str(e)}", 0)
                
                # Exponential backoff
                wait_time = (2 ** attempt) * 1.0
                print(f"Request failed (attempt {attempt + 1}), retrying in {wait_time}s...")
                time.sleep(wait_time)
    
    def health_check(self) -> Dict[str, str]:
        """Check if the API server is healthy"""
        return self._make_request('GET', '/health', require_auth=False)
    
    def get_api_info(self) -> Dict[str, str]:
        """Get API information"""
        return self._make_request('GET', '/api', require_auth=False)
    
    def get_page(self, page_id: str) -> GetPageResponse:
        """
        Retrieve a Notion page as Markdown
        
        Args:
            page_id: UUID of the Notion page
            
        Returns:
            GetPageResponse with markdown content and title
            
        Raises:
            NotionMarkdownApiError: If the request fails
        """
        self._validate_page_id(page_id)
        
        response_data = self._make_request('GET', f'/api/pages/{page_id}')
        
        return GetPageResponse(
            markdown=response_data['markdown'],
            title=response_data['title']
        )
    
    def append_to_page(self, page_id: str, markdown: str) -> AppendPageResponse:
        """
        Append Markdown content to an existing Notion page
        
        Args:
            page_id: UUID of the Notion page
            markdown: Markdown content to append
            
        Returns:
            AppendPageResponse indicating success
            
        Raises:
            NotionMarkdownApiError: If the request fails
        """
        self._validate_page_id(page_id)
        
        request_data = {'markdown': markdown}
        response_data = self._make_request(
            'POST', 
            f'/api/pages/{page_id}/append',
            data=request_data
        )
        
        return AppendPageResponse(success=response_data['success'])
    
    def _validate_page_id(self, page_id: str) -> None:
        """Validate that page_id is in UUID format"""
        uuid_pattern = r'^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
        if not re.match(uuid_pattern, page_id, re.IGNORECASE):
            raise ValueError('Invalid page ID format. Expected UUID format.')
    
    def __enter__(self):
        """Context manager entry"""
        return self
    
    def __exit__(self, exc_type, exc_val, exc_tb):
        """Context manager exit - close session"""
        self.session.close()


class NotionMarkdownUtils:
    """Utility functions for formatting Markdown content"""
    
    @staticmethod
    def format_daily_report(tasks: List[str], notes: str) -> str:
        """Format a daily report in Markdown"""
        date = datetime.now().strftime('%Y-%m-%d')
        
        task_list = '\n'.join(f'- [x] {task}' for task in tasks)
        
        return f"""
## Daily Report - {date}

### Completed Tasks
{task_list}

### Notes
{notes}

### Generated at
{datetime.now().isoformat()}
"""
    
    @staticmethod
    def format_code_snippet(code: str, language: str = 'python') -> str:
        """Format code as a Markdown code block"""
        return f'```{language}\n{code}\n```'
    
    @staticmethod
    def format_table(headers: List[str], rows: List[List[str]]) -> str:
        """Format data as a Markdown table"""
        header_row = '| ' + ' | '.join(headers) + ' |'
        separator_row = '| ' + ' | '.join(['---'] * len(headers)) + ' |'
        data_rows = '\n'.join('| ' + ' | '.join(row) + ' |' for row in rows)
        
        return f'{header_row}\n{separator_row}\n{data_rows}'
    
    @staticmethod
    def format_checklist(items: List[tuple[str, bool]]) -> str:
        """Format a checklist with completed/incomplete items"""
        return '\n'.join(
            f'- [{"x" if completed else " "}] {item}'
            for item, completed in items
        )


def basic_example():
    """Basic usage example"""
    config = NotionMarkdownConfig(
        base_url="http://localhost:8000",
        api_key="your-api-key-here"
    )
    
    with NotionMarkdownClient(config) as client:
        try:
            # Check API health
            health = client.health_check()
            print(f"API Health: {health}")
            
            # Get API info
            api_info = client.get_api_info()
            print(f"API Info: {api_info}")
            
            # Get a page
            page_id = "12345678-1234-1234-1234-123456789abc"
            page = client.get_page(page_id)
            print(f"Page Title: {page.title}")
            print(f"Content Length: {len(page.markdown)} characters")
            
            # Append content
            new_content = NotionMarkdownUtils.format_daily_report(
                tasks=["Completed Python integration", "Updated documentation"],
                notes="Everything is working smoothly!"
            )
            
            result = client.append_to_page(page_id, new_content)
            print(f"Append Success: {result.success}")
            
        except NotionMarkdownApiError as e:
            print(f"API Error ({e.status_code}): {e}")
            if e.details:
                print(f"Details: {e.details}")
        except Exception as e:
            print(f"Unexpected error: {e}")


def advanced_batch_example():
    """Advanced example with batch operations"""
    config = NotionMarkdownConfig(
        base_url=os.getenv("NOTION_MARKDOWN_API_URL", "http://localhost:8000"),
        api_key=os.getenv("NOTION_MARKDOWN_API_KEY", "your-api-key")
    )
    
    page_ids = [
        "12345678-1234-1234-1234-123456789abc",
        "87654321-4321-4321-4321-cba987654321",
    ]
    
    with NotionMarkdownClient(config) as client:
        results = []
        
        for i, page_id in enumerate(page_ids):
            try:
                # Generate unique content for each page
                content = f"""
## Batch Update #{i + 1}

### Timestamp
{datetime.now().isoformat()}

### Update Details
- Page ID: `{page_id}`
- Batch position: {i + 1} of {len(page_ids)}
- Generated by: Python API Client

### Sample Code
{NotionMarkdownUtils.format_code_snippet(f'''
# Example Python code for page {i + 1}
def process_page_{i + 1}():
    print("Processing page {page_id}")
    return True
''', 'python')}

### Status
- [x] Content generated
- [x] API call prepared
- [ ] Verification pending
"""
                
                result = client.append_to_page(page_id, content)
                results.append({
                    'page_id': page_id,
                    'success': result.success,
                    'error': None
                })
                print(f"✓ Updated page {page_id}")
                
                # Rate limiting
                time.sleep(0.5)
                
            except Exception as e:
                results.append({
                    'page_id': page_id,
                    'success': False,
                    'error': str(e)
                })
                print(f"✗ Failed to update page {page_id}: {e}")
        
        # Summary
        successful = sum(1 for r in results if r['success'])
        print(f"\nBatch operation completed: {successful}/{len(results)} successful")
        
        # Details of failures
        failures = [r for r in results if not r['success']]
        if failures:
            print("\nFailures:")
            for failure in failures:
                print(f"  - {failure['page_id']}: {failure['error']}")


def monitoring_example():
    """Example of monitoring and logging"""
    import logging
    
    # Setup logging
    logging.basicConfig(level=logging.INFO)
    logger = logging.getLogger(__name__)
    
    config = NotionMarkdownConfig(
        base_url=os.getenv("NOTION_MARKDOWN_API_URL", "http://localhost:8000"),
        api_key=os.getenv("NOTION_MARKDOWN_API_KEY", "your-api-key")
    )
    
    with NotionMarkdownClient(config) as client:
        try:
            # Health check with logging
            logger.info("Checking API health...")
            health = client.health_check()
            logger.info(f"API health status: {health['status']}")
            
            # Get API info
            api_info = client.get_api_info()
            logger.info(f"Connected to {api_info['name']} v{api_info['version']}")
            
            # Monitor page
            page_id = os.getenv("NOTION_PAGE_ID")
            if not page_id:
                logger.error("NOTION_PAGE_ID environment variable not set")
                return
            
            logger.info(f"Monitoring page: {page_id}")
            page = client.get_page(page_id)
            
            # Log page stats
            stats = {
                'title': page.title,
                'content_length': len(page.markdown),
                'line_count': page.markdown.count('\n'),
                'word_count': len(page.markdown.split()),
            }
            logger.info(f"Page stats: {stats}")
            
            # Add monitoring entry
            monitoring_content = f"""
---
**Monitoring Report**
- Timestamp: {datetime.now().isoformat()}
- Page Statistics: {json.dumps(stats, indent=2)}
- Monitor Status: ✓ Healthy
- Next Check: {(datetime.now()).strftime('%Y-%m-%d %H:%M:%S')}
"""
            
            client.append_to_page(page_id, monitoring_content)
            logger.info("Monitoring report added to page")
            
        except NotionMarkdownApiError as e:
            logger.error(f"API Error ({e.status_code}): {e}")
            if e.details:
                logger.error(f"Error details: {e.details}")
        except Exception as e:
            logger.error(f"Unexpected error: {e}")


def interactive_example():
    """Interactive example for testing"""
    print("Notion Markdown API - Interactive Example")
    print("=" * 40)
    
    # Get configuration from environment or user input
    base_url = os.getenv("NOTION_MARKDOWN_API_URL") or input("Enter API base URL [http://localhost:8000]: ").strip() or "http://localhost:8000"
    api_key = os.getenv("NOTION_MARKDOWN_API_KEY") or input("Enter API key: ").strip()
    
    if not api_key:
        print("API key is required!")
        return
    
    config = NotionMarkdownConfig(base_url=base_url, api_key=api_key)
    
    with NotionMarkdownClient(config) as client:
        try:
            # Test connection
            print("\n1. Testing connection...")
            health = client.health_check()
            print(f"   ✓ API is {health['status']}")
            
            api_info = client.get_api_info()
            print(f"   ✓ Connected to {api_info['name']} v{api_info['version']}")
            
            # Get page ID
            page_id = os.getenv("NOTION_PAGE_ID") or input("\nEnter Notion page ID (UUID): ").strip()
            
            if not page_id:
                print("Page ID is required!")
                return
            
            print(f"\n2. Getting page content...")
            page = client.get_page(page_id)
            print(f"   ✓ Title: {page.title}")
            print(f"   ✓ Content: {len(page.markdown)} characters")
            
            # Ask if user wants to append content
            append = input("\n3. Do you want to append test content? (y/N): ").strip().lower()
            
            if append == 'y':
                test_content = f"""
## Interactive Test - {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}

This content was added through the interactive Python example.

### Test Results
- ✓ Connection established
- ✓ Page retrieved successfully
- ✓ Content appended

### Environment
- Python client version: 1.0
- Timestamp: {datetime.now().isoformat()}
- User: Interactive session
"""
                
                result = client.append_to_page(page_id, test_content)
                if result.success:
                    print("   ✓ Content appended successfully!")
                else:
                    print("   ✗ Failed to append content")
            
            print("\n✓ Interactive example completed successfully!")
            
        except NotionMarkdownApiError as e:
            print(f"\n✗ API Error ({e.status_code}): {e}")
            if e.details:
                print(f"   Details: {e.details}")
        except KeyboardInterrupt:
            print("\n\nOperation cancelled by user.")
        except Exception as e:
            print(f"\n✗ Unexpected error: {e}")


if __name__ == "__main__":
    print("Choose an example to run:")
    print("1. Basic example")
    print("2. Advanced batch example")
    print("3. Monitoring example")
    print("4. Interactive example")
    
    choice = input("\nEnter choice (1-4): ").strip()
    
    if choice == "1":
        basic_example()
    elif choice == "2":
        advanced_batch_example()
    elif choice == "3":
        monitoring_example()
    elif choice == "4":
        interactive_example()
    else:
        print("Invalid choice. Running basic example...")
        basic_example()