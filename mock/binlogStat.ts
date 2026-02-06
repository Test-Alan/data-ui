import { Request, Response } from 'express';
import moment from 'moment';
import { parse } from 'url';

// Define the type for binlog stat
interface BinlogStat {
  id: number;
  schemaName: string;
  tableName: string;
  binlogCount: number;
  binlogLastTime: string;
  createTime: string;
  updateTime: string;
}

// Mock data
const binlogStatTableList: BinlogStat[] = [];

for (let i = 0; i < 50; i += 1) {
  const binlogCount = Math.floor(Math.random() * 20000);
  binlogStatTableList.push({
    id: i,
    schemaName: `schema_${Math.floor(i / 10) + 1}`,
    tableName: `table_${i % 10 + 1}`,
    binlogCount,
    binlogLastTime: moment().subtract(Math.floor(Math.random() * 48), 'hours').format('YYYY-MM-DD HH:mm:ss'),
    createTime: moment().subtract(Math.floor(Math.random() * 7), 'days').format('YYYY-MM-DD HH:mm:ss'),
    updateTime: moment().subtract(Math.floor(Math.random() * 24), 'hours').format('YYYY-MM-DD HH:mm:ss'),
  });
}

function getBinlogStats(req: Request, res: Response, u: string) {
  const url = u || req.url;
  const params = parse(url, true).query;

  let dataSource = [...binlogStatTableList];

  // Filter by schema name
  if (params.schemaName) {
    dataSource = dataSource.filter(data => data.schemaName.includes(params.schemaName as string));
  }

  // Filter by table name
  if (params.tableName) {
    dataSource = dataSource.filter(data => data.tableName.includes(params.tableName as string));
  }

  const current = parseInt(params.current as string, 10) || 1;
  const pageSize = parseInt(params.pageSize as string, 10) || 10;
  const startIndex = (current - 1) * pageSize;
  const endIndex = startIndex + pageSize;

  const result = {
    data: {
      list: dataSource.slice(startIndex, endIndex),
      total: dataSource.length,
    },
    success: true,
  };

  return res.json(result);
}

export default {
  'GET /api/management/binlog/stats/paging': getBinlogStats,
}; 