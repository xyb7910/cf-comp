"""
Django Management Command: 上传算法模板数据
Usage: python manage.py upload_templates
"""
from django.core.management.base import BaseCommand
from api.models import AlgorithmTemplate


class Command(BaseCommand):
    help = '上传算法模板数据到数据库'

    def handle(self, *args, **options):
        # 算法模板数据
        templates = [
            {
                "id": "quick-sort",
                "category": "排序算法",
                "name": "快速排序",
                "difficulty": "基础",
                "description": "经典的分治排序算法，原地排序，稳定性差但平均效率高",
                "detailed_description": "快速排序是一种分治算法，通过选择一个基准元素（pivot），将数组分为两部分，小于基准的放左边，大于基准的放右边，然后递归对两部分进行排序。该算法的平均时间复杂度为O(n log n)，是实际应用中最常用的排序算法之一。",
                "time_complexity": "平均: O(n log n), 最坏: O(n²)",
                "space_complexity": "O(log n) (递归栈)",
                "code": """#include <iostream>
#include <vector>
using namespace std;

int partition(vector<int>& arr, int low, int high) {
    int pivot = arr[high];
    int i = low - 1;
    for (int j = low; j < high; j++) {
        if (arr[j] < pivot) {
            i++;
            swap(arr[i], arr[j]);
        }
    }
    swap(arr[i + 1], arr[high]);
    return i + 1;
}

void quickSort(vector<int>& arr, int low, int high) {
    if (low < high) {
        int pi = partition(arr, low, high);
        quickSort(arr, low, pi - 1);
        quickSort(arr, pi + 1, high);
    }
}

int main() {
    vector<int> arr = {64, 34, 25, 12, 22, 11, 90};
    quickSort(arr, 0, arr.size() - 1);
    for (int x : arr) cout << x << " ";
    return 0;
}""",
                "tags": ["排序", "分治", "快速", "原地"],
                "usage": "适用于大多数排序场景，对无序数组排序效率高",
                "example_input": "64 34 25 12 22 11 90",
                "example_output": "11 12 22 25 34 64 90",
            },
            {
                "id": "binary-search",
                "category": "搜索算法",
                "name": "二分查找",
                "difficulty": "基础",
                "description": "高效的有序数组查找算法，每次排除一半的元素",
                "detailed_description": "二分查找要求数组预先有序，通过比较目标值与中间元素的大小，不断缩小查找范围，直到找到目标或确定不存在。这是查找算法中效率最高的算法之一，尤其适用于静态有序数组的多次查找场景。",
                "time_complexity": "O(log n)",
                "space_complexity": "O(1) (迭代) / O(log n) (递归)",
                "code": """#include <iostream>
#include <vector>
using namespace std;

int binarySearch(vector<int>& arr, int target) {
    int left = 0, right = arr.size() - 1;
    while (left <= right) {
        int mid = left + (right - left) / 2;
        if (arr[mid] == target) return mid;
        if (arr[mid] < target) left = mid + 1;
        else right = mid - 1;
    }
    return -1;
}

int main() {
    vector<int> arr = {1, 3, 5, 7, 9, 11, 13, 15};
    cout << binarySearch(arr, 7) << endl;
    return 0;
}""",
                "tags": ["搜索", "二分", "有序数组", "查找"],
                "usage": "在有序数组中高效查找元素",
                "example_input": "7",
                "example_output": "3",
            },
            {
                "id": "dijkstra",
                "category": "图算法",
                "name": "Dijkstra 最短路",
                "difficulty": "进阶",
                "description": "单源最短路径算法，适用于非负权边图",
                "detailed_description": "Dijkstra算法使用贪心策略，从起点开始，每次选择当前距离最小的顶点进行松弛操作，使用优先队列（堆）可以高效实现。适用于有向图或无向图，但要求所有边的权值非负。",
                "time_complexity": "O(M + N log N) (使用优先队列)",
                "space_complexity": "O(N)",
                "code": """#include <iostream>
#include <vector>
#include <queue>
#include <climits>
using namespace std;
typedef pair<int, int> pii;

vector<int> dijkstra(vector<vector<pii>>& adj, int n, int start) {
    vector<int> dist(n, INT_MAX);
    priority_queue<pii, vector<pii>, greater<pii>> pq;
    dist[start] = 0;
    pq.push({0, start});
    while (!pq.empty()) {
        auto [d, u] = pq.top(); pq.pop();
        if (d > dist[u]) continue;
        for (auto [v, w] : adj[u]) {
            if (dist[v] > dist[u] + w) {
                dist[v] = dist[u] + w;
                pq.push({dist[v], v});
            }
        }
    }
    return dist;
}

int main() {
    int n = 5;
    vector<vector<pii>> adj(n);
    vector<int> dist = dijkstra(adj, n, 0);
    for (int i = 0; i < n; i++) cout << dist[i] << " ";
    return 0;
}""",
                "tags": ["图论", "最短路", "优先队列", "贪心"],
                "usage": "求图中单源最短路径问题",
            },
            {
                "id": "bfs",
                "category": "图算法",
                "name": "BFS 广度优先",
                "difficulty": "基础",
                "description": "图的层序遍历算法，可用于无权图最短路径",
                "detailed_description": "广度优先搜索从起始点开始，先访问所有相邻节点，再逐层向外扩展。使用队列实现，是无权图求最短路径的标准算法，也可用于图的遍历和状态搜索。",
                "time_complexity": "O(N + M)",
                "space_complexity": "O(N)",
                "code": """#include <iostream>
#include <vector>
#include <queue>
using namespace std;

void bfs(vector<vector<int>>& adj, int n, int start) {
    vector<bool> visited(n, false);
    queue<int> q;
    visited[start] = true;
    q.push(start);
    while (!q.empty()) {
        int u = q.front();
        q.pop();
        cout << u << " ";
        for (int v : adj[u]) {
            if (!visited[v]) {
                visited[v] = true;
                q.push(v);
            }
        }
    }
}

int main() {
    int n = 5;
    vector<vector<int>> adj(n);
    bfs(adj, n, 0);
    return 0;
}""",
                "tags": ["图论", "搜索", "队列", "层序"],
                "usage": "层序遍历、无权图最短路径",
            },
            {
                "id": "segment-tree",
                "category": "数据结构",
                "name": "线段树",
                "difficulty": "高级",
                "description": "高效的区间查询和更新数据结构",
                "detailed_description": "线段树是一种二叉搜索树，将区间划分为多个单元区间，每个叶子节点对应一个元素，内部节点表示一个区间。支持单点修改、区间查询等操作，时间复杂度均为O(log n)。",
                "time_complexity": "查询: O(log n), 更新: O(log n)",
                "space_complexity": "O(4N)",
                "code": """#include <iostream>
#include <vector>
using namespace std;

class SegmentTree {
private:
    vector<int> tree;
    int n;
public:
    SegmentTree(vector<int>& arr) {
        n = arr.size();
        tree.resize(4 * n);
        build(arr, 0, 0, n - 1);
    }
    
    void build(vector<int>& arr, int node, int start, int end) {
        if (start == end) {
            tree[node] = arr[start];
            return;
        }
        int mid = (start + end) / 2;
        build(arr, 2*node+1, start, mid);
        build(arr, 2*node+2, mid+1, end);
        tree[node] = tree[2*node+1] + tree[2*node+2];
    }
    
    void update(int idx, int val, int node=0, int start=0, int end=-1) {
        if (end == -1) end = n - 1;
        if (start == end) {
            tree[node] = val;
            return;
        }
        int mid = (start + end) / 2;
        if (idx <= mid) update(idx, val, 2*node+1, start, mid);
        else update(idx, val, 2*node+2, mid+1, end);
        tree[node] = tree[2*node+1] + tree[2*node+2];
    }
    
    int query(int l, int r, int node=0, int start=0, int end=-1) {
        if (end == -1) end = n - 1;
        if (r < start || end < l) return 0;
        if (l <= start && end <= r) return tree[node];
        int mid = (start + end) / 2;
        return query(l, r, 2*node+1, start, mid) +
               query(l, r, 2*node+2, mid+1, end);
    }
};

int main() {
    vector<int> arr = {1, 3, 5, 7, 9};
    SegmentTree st(arr);
    cout << st.query(0, 2) << endl;
    st.update(1, 10);
    cout << st.query(0, 2) << endl;
    return 0;
}""",
                "tags": ["数据结构", "区间查询", "线段树", "区间更新"],
                "usage": "区间求和、最值、更新",
            },
            {
                "id": "union-find",
                "category": "数据结构",
                "name": "并查集 (Union-Find)",
                "difficulty": "基础",
                "description": "高效处理动态连通性问题的数据结构",
                "detailed_description": "并查集支持两种核心操作：合并两个集合（union）和查询元素所在集合（find）。通过路径压缩和按秩（size）合并优化，操作的平均时间复杂度接近常数。",
                "time_complexity": "O(α(N)) (α为阿克曼函数的反函数)",
                "space_complexity": "O(N)",
                "code": """#include <iostream>
#include <vector>
using namespace std;

class UnionFind {
private:
    vector<int> parent;
    vector<int> rank;
public:
    UnionFind(int n) {
        parent.resize(n);
        rank.resize(n, 0);
        for (int i = 0; i < n; i++) parent[i] = i;
    }
    
    int find(int x) {
        if (parent[x] != x) parent[x] = find(parent[x]);
        return parent[x];
    }
    
    void unite(int x, int y) {
        x = find(x), y = find(y);
        if (x == y) return;
        if (rank[x] < rank[y]) parent[x] = y;
        else {
            parent[y] = x;
            if (rank[x] == rank[y]) rank[x]++;
        }
    }
    
    bool same(int x, int y) {
        return find(x) == find(y);
    }
};

int main() {
    UnionFind uf(5);
    uf.unite(0, 1);
    uf.unite(1, 2);
    cout << uf.same(0, 2) << endl;
    return 0;
}""",
                "tags": ["数据结构", "连通性", "路径压缩", "并查集"],
                "usage": "Kruskal算法、动态连通性",
            },
        ]

        self.stdout.write(self.style.SUCCESS("=" * 60))
        self.stdout.write(self.style.SUCCESS("  上传算法模板数据"))
        self.stdout.write(self.style.SUCCESS("=" * 60))
        self.stdout.write("")

        # 上传算法模板
        self.stdout.write(self.style.HTTP_INFO("📤 上传算法模板..."))
        self.stdout.write("-" * 40)
        for template_data in templates:
            template, created = AlgorithmTemplate.objects.update_or_create(
                id=template_data["id"],
                defaults=template_data
            )
            if created:
                self.stdout.write(self.style.SUCCESS(f"✅ 创建: {template.name}"))
            else:
                self.stdout.write(self.style.WARNING(f"🔄 更新: {template.name}"))

        self.stdout.write("")
        self.stdout.write(self.style.SUCCESS("=" * 60))
        self.stdout.write(self.style.SUCCESS("  ✅ 数据上传完成！"))
        self.stdout.write(self.style.SUCCESS("=" * 60))

        # 列出所有算法模板
        self.stdout.write("")
        self.stdout.write(self.style.HTTP_INFO("📋 当前数据库中的算法模板:"))
        self.stdout.write("-" * 40)
        templates = AlgorithmTemplate.objects.all()
        for template in templates:
            self.stdout.write(f"  • {template.name} ({template.category}) - {template.difficulty}")
        self.stdout.write(f"\n总计: {templates.count()} 个算法模板")
