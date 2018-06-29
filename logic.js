/**
 * New script file
 */
/**
 * New script file
 */
/**
 * Place Order transaction by Retailer
 * @param {com.syntel.demo.retail.SaveOrder} SaveOrderTx - the place order transaction
 * @transaction
 */
function SaveOrder(SaveOrderTx) {

    return getAssetRegistry('com.syntel.demo.retail.Order').then(function(orderRegistry) {
	    var factory = getFactory();
        // Create order asset.
        var orderAsset = factory.newResource('com.syntel.demo.retail', 'Order', SaveOrderTx.orderId);
	    orderAsset.orderId = SaveOrderTx.orderId;
	    orderAsset.orderDescription = SaveOrderTx.orderDescription;	    
	    orderAsset.orderDate = SaveOrderTx.orderDate;
		orderAsset.orderStatus = "S";
	    orderAsset.comments = SaveOrderTx.comments;	    
	    orderAsset.seller = getCurrentParticipant();
	    orderAsset.logisticProvider = SaveOrderTx.logisticProvider;
		
		if(!orderAsset.orderShipments) {
			orderAsset.orderShipments = [];                        
		}
		
       	var myArray = SaveOrderTx.orderShipments;
		
		myArray.forEach(function(item){
			
			orderAsset.orderShipments.push(item);
		
			
			return getAssetRegistry('com.syntel.demo.retail.OrderShipment').then(function(orderShipmentRegistry) {
				// Create shipment asset.
				var shipmentAsset = factory.newResource('com.syntel.demo.retail', 'OrderShipment', item.shipmentId);
				shipmentAsset.shipmentId = item.shipmentId;
				shipmentAsset.shipmentDescription = item.shipmentDescription;
				shipmentAsset.shipmentType = item.shipmentType;
				shipmentAsset.shipmentDetails = item.shipmentDetails;
				shipmentAsset.shipmentTransportDetails = item.shipmentTransportDetails;
				shipmentAsset.shipmentDeliveryDate = item.shipmentDeliveryDate;
				shipmentAsset.shipmentTracking = item.shipmentTracking;				
				shipmentAsset.shipmentTracking.shipmentStatus ="S";
				
				
				
				// Add the new shipment asset into the registry.
				return orderShipmentRegistry.add(shipmentAsset);	
			});	
		
		
		// no contract violation
		//if(orderAsset.orderStatus === ""){
			//orderAsset.orderStatus = "R";
		//}
		    
        // Add the new order asset into the registry.
        
	
	});	
	 return orderRegistry.add(orderAsset);
	});
    
	
}










/**
 * Place Order transaction by Retailer
 * @param {com.syntel.demo.retail.TransferOrder} TransferOrderTx - the place order transaction
 * @transaction
 */
function TransferOrder(TransferOrderTx) {
	
		//TransferOrderTx.order.logisticProvider = TransferOrderTx.logisticProvider;
  TransferOrderTx.order.orderStatus = "R";
	
		// if array is null
		if(!TransferOrderTx.order.rejectionReasons) {
			TransferOrderTx.order.rejectionReasons = [];                        
		}
		
		var myArray = TransferOrderTx.order.orderShipments;
		
		myArray.forEach(function(item){
			
          item.shipmentTracking.shipmentStatus = "PD";
					
			// BR-1: does the max volumn size for medicines with RT conditon violate the contract?
			if (item.shipmentType === 'MD' && item.shipmentDetails.specialCondition === 'RT') {				
				if(item.shipmentDetails.volume > 500){
					TransferOrderTx.order.orderStatus = "RE";
					TransferOrderTx.order.rejectionReasons.push('Volumn exceeds the contract value for medicine with refrigerated condition #'+item.shipmentId);
				}								
			}
			// BR-2: does the max volumn size for package weight 15KG violate the contract?
			if(item.shipmentDetails.weight == 15){
				if(item.shipmentDetails.volume > 100){
					TransferOrderTx.order.orderStatus = "RE";
					TransferOrderTx.order.rejectionReasons.push('Volumn exceeds for package weight 15KG #'+item.shipmentId);
				}
			}
			//BR-3: does delivery pin codes for no delay allowed item violate contract?
			if(item.shipmentDetails.specialCondition === 'NDA'){
				//Tier-1 pin code range between 90001 and 90089
				if(item.shipmentTransportDetails.destinationPinCode < 90001 || item.shipmentTransportDetails.destinationPinCode > 90089){
					TransferOrderTx.order.orderStatus = "RE";
					TransferOrderTx.order.rejectionReasons.push('Delivery pin code is outside for item no delays allowed  #'+item.shipmentId);
				}
			}			
			//BR-4: does the pickup and delivery date for special handling item violate the contract?
			if(item.shipmentDetails.specialCondition === 'SH'){
				if(item.shipmentDeliveryDate.pickUpDate.getTime() == item.shipmentDeliveryDate.deliveryDate.getTime()){
					TransferOrderTx.order.orderStatus = "RE";
					TransferOrderTx.order.rejectionReasons.push('Pickup and delivery date are same for special handling item #'+item.shipmentId);
				}
			}
			//BR-5: does delivery pin codes is outside service area violate contract?
			if(item.shipmentTransportDetails.destinationPinCode < 30001 || item.shipmentTransportDetails.destinationPinCode > 30089){
				TransferOrderTx.order.orderStatus = "RE";
				TransferOrderTx.order.rejectionReasons.push('Delivery pin code is outside service area  #'+item.shipmentId);
			}
			//BR-6: does the min and max volume violate the contract?
			if(item.shipmentDetails.volume < 8 || item.shipmentDetails.volume > 500){
				TransferOrderTx.order.orderStatus = "RE";
				TransferOrderTx.order.rejectionReasons.push('Min/max volume is violate the contract #'+item.shipmentId);
			}
			//BR-7: does the max weight violate the contract?
			if(item.shipmentDetails.weight > 1000){
				TransferOrderTx.order.orderStatus = "RE";
				TransferOrderTx.order.rejectionReasons.push('Max weight violate the contract #'+item.shipmentId);
			}
			//if order is Rejected(RE),then all shipments will be Rejected(RE)
			if(TransferOrderTx.order.orderStatus === 'RE'){					
				item.shipmentTracking.shipmentStatus = "RE";
			}
			
			return getAssetRegistry('com.syntel.demo.retail.OrderShipment').then(function(orderShipmentRegistry) {							
				// Update shipment asset into the registry.
				return orderShipmentRegistry.update(item);	
			});		
		
			
		});
  
return getAssetRegistry('com.syntel.demo.retail.Order').then(function(orderRegistry){ 
				// Update order asset into the registry.
				return orderRegistry.update(TransferOrderTx.order);
});
        
	
}
				
			
			
			
			
			
			
			
			
			
			
			
			

/**
 * Update shipment tracking transaction by Logistic provider
 * @param {com.syntel.demo.retail.UpdateShipmentTracking} updateShipmentTrackingTx - update shipment tracking transaction
 * @transaction
 */
function updateShipmentTracking(updateShipmentTrackingTx) {	
	
	updateShipmentTrackingTx.orderShipment.shipmentTracking.shipmentStatus = updateShipmentTrackingTx.shipmentStatus;
    updateShipmentTrackingTx.orderShipment.shipmentTracking.date = updateShipmentTrackingTx.date;
    updateShipmentTrackingTx.orderShipment.shipmentTracking.comments = updateShipmentTrackingTx.comments;
   var orderShipmentNotification = getFactory().newEvent('com.syntel.demo.retail', 'ShipmentNotification');
                    orderShipmentNotification.shipmentId = updateShipmentTrackingTx.orderShipment.shipmentId;
                     orderShipmentNotification.date = updateShipmentTrackingTx.orderShipment.shipmentTracking.date;
  
               orderShipmentNotification.sourceAddress = updateShipmentTrackingTx.orderShipment.shipmentTransportDetails.sourceAddress;
  
         orderShipmentNotification.destinationAddress = updateShipmentTrackingTx.orderShipment.shipmentTransportDetails.destinationAddress;
  
       orderShipmentNotification.pickUpDate = updateShipmentTrackingTx.orderShipment.shipmentDeliveryDate.pickUpDate;
  
  orderShipmentNotification.deliveryDate = updateShipmentTrackingTx.orderShipment.shipmentDeliveryDate.deliveryDate;
  
    orderShipmentNotification.shipmentStatus = updateShipmentTrackingTx.orderShipment.shipmentTracking.shipmentStatus;
  
  
     console.log(orderShipmentNotification);
  
	 emit(orderShipmentNotification);
  
	
    return getAssetRegistry('com.syntel.demo.retail.OrderShipment')
		.then(function(orderShipmentRegistry) {
			//Update the state of the order shipment record which is already exists
            return orderShipmentRegistry.update(updateShipmentTrackingTx.orderShipment);
		})
		.then(function() {
            return getAssetRegistry('com.syntel.demo.retail.Order')
		})
		.then(function(orderRegistry) {
			updateShipmentTrackingTx.order.orderStatus = "P";
			var myArray = updateShipmentTrackingTx.order.orderShipments;
			var flag = true;
			myArray.forEach(function(item){
				if(item.shipmentTracking.shipmentStatus != "DV"){
					flag = false;
				}				
			});
			if(flag == true){
				updateShipmentTrackingTx.order.orderStatus = "F";
			}
            return orderRegistry.update(updateShipmentTrackingTx.order);
		});
}


/**
 * Order shipment history by Logistic provider
 * @param {com.syntel.demo.retail.GetShipmentHistory} getShipmentHistoryTx - historian record tracking transaction
 * @transaction
 */
 function GetShipmentHistory(getShipmentHistoryTx) {
    var shipmentId = getShipmentHistoryTx.shipmentId;    
    returnResults = [];
    return query('gethistory')
	      .then(function(results){
    		for(var n=0;n<results.length;n++){
              console.log('N = '+n);
              	var orderShipment = results[n];
              	for(var m=0;m<orderShipment.eventsEmitted.length;m++){
                  var eventItem = orderShipment.eventsEmitted[m];
                  if(eventItem.shipmentId == shipmentId){
                    returnResults.push(eventItem);
                    //console.log(eventItem);
                  }
                }
            }
      console.log(returnResults);
      return returnResults;
    			
    });
    
}
          
		  
