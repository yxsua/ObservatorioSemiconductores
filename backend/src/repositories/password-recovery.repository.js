const pool=require('../config/database');
module.exports={
 async throttle(key,limit){
  await pool.query('DELETE FROM recovery_rate_limits WHERE expires_at<=now()');
  const {rows}=await pool.query(`INSERT INTO recovery_rate_limits(key_hash,hits,expires_at) VALUES($1,1,now()+interval '15 minutes') ON CONFLICT(key_hash) DO UPDATE SET hits=recovery_rate_limits.hits+1 RETURNING hits`,[key]);
  return rows[0].hits<=limit;
 },
 async issue(email,hash){
  const db=await pool.connect();try{await db.query('BEGIN');
   await db.query('DELETE FROM password_reset_tokens WHERE expires_at<=now()');
   const {rows}=await db.query('SELECT id_user FROM users WHERE email=$1 AND active FOR UPDATE',[email]);
   if(!rows.length){await db.query('COMMIT');return false;}
   await db.query('DELETE FROM password_reset_tokens WHERE user_id=$1',[rows[0].id_user]);
   await db.query(`INSERT INTO password_reset_tokens(token_hash,user_id,expires_at) VALUES($1,$2,now()+interval '30 minutes')`,[hash,rows[0].id_user]);
   await db.query('COMMIT');return true;
  }catch(error){await db.query('ROLLBACK');throw error;}finally{db.release();}
 },
 async revoke(hash){await pool.query('DELETE FROM password_reset_tokens WHERE token_hash=$1',[hash]);},
 async consume(hash,passwordHash){
  const db=await pool.connect();try{await db.query('BEGIN');
   // Lock the account first, matching issuance, so simultaneous requests cannot reuse a token.
   const {rows}=await db.query(`SELECT u.id_user FROM users u JOIN password_reset_tokens t ON t.user_id=u.id_user WHERE t.token_hash=$1 AND t.expires_at>now() AND u.active FOR UPDATE OF u`,[hash]);
   if(!rows.length){await db.query('ROLLBACK');return false;}
   const token=await db.query('DELETE FROM password_reset_tokens WHERE token_hash=$1 AND expires_at>now() RETURNING user_id',[hash]);
   if(!token.rowCount){await db.query('ROLLBACK');return false;}
   await db.query('UPDATE users SET password_hash=$2,auth_version=auth_version+1 WHERE id_user=$1',[rows[0].id_user,passwordHash]);
   await db.query('DELETE FROM password_reset_tokens WHERE user_id=$1',[rows[0].id_user]);
   await db.query('COMMIT');return true;
  }catch(error){await db.query('ROLLBACK');throw error;}finally{db.release();}
 }
};
