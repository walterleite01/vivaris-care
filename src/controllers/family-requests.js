const { query } = require('../db');
const { v4: uuidv4 } = require('uuid');

async function createRequest(req, res) {
  console.log('==> POST /api/family-requests');
  console.log('==> Body:', JSON.stringify(req.body, null, 2));

  try {
    const { resident_id, request_type, title, description, priority } = req.body;

    if (!resident_id || !request_type || !title || !description) {
      return res.status(400).json({ 
        error: 'Campos obrigatorios: resident_id, request_type, title, description' 
      });
    }

    const requestId = uuidv4();
    
    const departmentMap = {
      'solicitar_atualizacao': 'assistencial',
      'contato_medico': 'medico',
      'visita': 'admin',
      'informacao_importante': 'assistencial',
      'duvida_medicacao': 'assistencial',
      'questao_financeira': 'admin',
      'relatar_observacao': 'assistencial',
      'outra': 'admin'
    };
    
    const assignedDept = departmentMap[request_type] || 'admin';
    
    const slaHours = priority === 'high' ? 2 : priority === 'low' ? 48 : 24;
    const deadline = new Date();
    deadline.setHours(deadline.getHours() + slaHours);

    await query(
      `INSERT INTO family_requests 
       (id, resident_id, family_id, request_type, title, description, priority, assigned_department, response_deadline, created_at) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())`,
      [
        requestId, resident_id, req.user.id, request_type, title,
        description, priority || 'medium', assignedDept, deadline
      ]
    );

    res.status(201).json({
      success: true,
      message: 'Solicitacao enviada',
      request_id: requestId,
      assigned_department: assignedDept,
      response_deadline: deadline
    });

  } catch (error) {
    console.error('==> ERRO createRequest:', error.message);
    res.status(500).json({ error: 'Erro ao criar solicitacao', details: error.message });
  }
}

async function getRequests(req, res) {
  try {
    const { status, resident_id } = req.query;
    
    let filters = ['1=1'];
    let params = [];
    let paramIdx = 1;

    if (req.user.role === 'familiar') {
      filters.push(`fr.family_id = $${paramIdx}`);
      params.push(req.user.id);
      paramIdx++;
    } else if (req.user.role !== 'admin') {
      filters.push(`fr.assigned_department = $${paramIdx}`);
      params.push(req.user.role);
      paramIdx++;
    }

    if (status) {
      filters.push(`fr.status = $${paramIdx}`);
      params.push(status);
      paramIdx++;
    }
    if (resident_id) {
      filters.push(`fr.resident_id = $${paramIdx}`);
      params.push(resident_id);
      paramIdx++;
    }

    const result = await query(
      `SELECT 
        fr.*,
        u.full_name as family_name,
        r.full_name as resident_name
       FROM family_requests fr
       LEFT JOIN users u ON fr.family_id = u.id
       LEFT JOIN residents r ON fr.resident_id = r.id
       WHERE ${filters.join(' AND ')}
       ORDER BY fr.created_at DESC
       LIMIT 100`,
      params
    );

    res.json({
      success: true,
      total: result.rows.length,
      data: result.rows
    });

  } catch (error) {
    console.error('==> ERRO getRequests:', error.message);
    res.status(500).json({ error: 'Erro ao buscar solicitacoes', details: error.message });
  }
}

async function respondRequest(req, res) {
  try {
    const { id } = req.params;
    const { response, status } = req.body;

    if (!response) {
      return res.status(400).json({ error: 'Resposta e obrigatoria' });
    }

    await query(
      `UPDATE family_requests 
       SET response = $1, status = $2, assigned_to = $3, 
           resolved_at = CASE WHEN $2 IN ('resolved', 'closed') THEN NOW() ELSE NULL END
       WHERE id = $4`,
      [response, status || 'resolved', req.user.id, id]
    );

    res.json({ success: true, message: 'Solicitacao respondida' });

  } catch (error) {
    res.status(500).json({ error: 'Erro ao responder solicitacao' });
  }
}

module.exports = { createRequest, getRequests, respondRequest };
